import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import test, { after } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { build } from "esbuild";

// This fork grants every license entitlement unconditionally. These tests pin that:
// a merge from upstream that adds or flips a gate must fail here.
const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const directory = mkdtempSync(join(root, "node_modules", "license-unlock-test-"));
after(() => rmSync(directory, { recursive: true, force: true }));
await build({
	stdin: {
		contents: `
			export { SqliteDatabase } from "./server/runtime/sqlite-database.ts";
			export { applyMigrations } from "./server/runtime/migrate.ts";
			export { getLicenseEntitlements } from "./src/lib/licenses/service.ts";
			export { isTeamMailboxSharingEnabled } from "./src/lib/mailboxes/access-utils.ts";
			export { getBranding } from "./src/lib/branding/service.ts";
			export { getAccountForwardingDestination } from "./src/lib/email/account-forwarding.ts";
		`,
		resolveDir: root,
		sourcefile: "license-unlock-test-entry.ts",
	},
	outfile: join(directory, "entry.mjs"),
	bundle: true,
	platform: "node",
	format: "esm",
	target: "node24",
	tsconfig: join(root, "tsconfig.json"),
	packages: "external",
	alias: { "next/headers": "next/headers.js", "next/server": "next/server.js", "cloudflare:workers": "./server/runtime/cloudflare-workers.ts" },
	logLevel: "silent",
});
const { SqliteDatabase, applyMigrations, getLicenseEntitlements, isTeamMailboxSharingEnabled, getBranding, getAccountForwardingDestination } =
	await import(pathToFileURL(join(directory, "entry.mjs")).href);

const UNLOCKED = {
	plan: "team",
	canCustomizeBranding: true,
	canManageAccounts: true,
	canShareMailboxes: true,
	accountSeatLimit: null,
	canForwardEmail: true,
};

/** A migrated database whose license row says the installation is unlicensed. */
async function fixture(t) {
	const database = new SqliteDatabase(":memory:");
	t.after(() => database.db.close());
	await applyMigrations(database, join(root, "drizzle/migrations"));
	database.db.exec(`
		INSERT INTO license_settings (id, instance_id, plan, state, features, seat_limit, updated_at)
			VALUES ('default', 'unlock-test', 'community', 'inactive', '[]', 1, 1);
	`);
	return { database, env: { DB: database, MAILFLARE_RUNTIME: "node" } };
}

test("entitlements are fully granted without any database", async () => {
	assert.deepEqual(await getLicenseEntitlements({}), UNLOCKED);
	assert.equal(await isTeamMailboxSharingEnabled(undefined), true);
});

test("an unlicensed license_settings row changes nothing", async (t) => {
	const f = await fixture(t);
	assert.deepEqual(await getLicenseEntitlements(f.env), UNLOCKED);
});

test("saved branding is served with no license", async (t) => {
	const f = await fixture(t);
	f.database.db.exec("INSERT INTO app_settings (id, app_name, updated_at) VALUES ('default', 'Correo de Luca', 1) ON CONFLICT (id) DO UPDATE SET app_name = 'Correo de Luca'");
	assert.deepEqual(await getBranding(f.env), { appName: "Correo de Luca", hasCustomIcon: false, canCustomizeBranding: true });
});

test("a stored forwarding address is honoured with no license", async (t) => {
	const f = await fixture(t);
	f.database.db.exec(`
		INSERT INTO users (id, email, password_hash, name, role, is_primary_admin, forwarding_email, created_at)
			VALUES ('sam', 'sam@one.test', 'hash', 'Sam', 'admin', 1, 'away@elsewhere.test', 1);
		INSERT INTO domains (id, user_id, hostname, zone_id, status, created_at)
			VALUES ('one', 'sam', 'one.test', 'zone-one', 'active', 1);
		INSERT INTO mailboxes (id, user_id, domain_id, local_part, display_name, type, use_all_domains, disabled, created_at)
			VALUES ('m-sam', 'sam', 'one', 'sam', 'Sam', 'personal', 0, 0, 1);
	`);
	assert.equal(await getAccountForwardingDestination(f.env, "sam@one.test"), "away@elsewhere.test");
});
