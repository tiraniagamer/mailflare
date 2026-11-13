import type { AppDatabase } from "@/db";

// This fork enables mailbox sharing regardless of license_settings; tests/license-unlock.test.mjs pins it.
export async function isTeamMailboxSharingEnabled(db: AppDatabase): Promise<boolean> {
	void db;
	return true;
}
