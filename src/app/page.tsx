import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerTranslator } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n/types";
import { getCurrentUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { LanguageSelector } from "@/components/language-selector";
import { getHomeBranding } from "./home-server-utils";
import { HomeAuthProvider } from "./home-auth";
import { HomeHeaderActions } from "./home-header-actions";
import { HomeHeroActions } from "./home-hero-actions";
import { HOME_BRAND, HOME_LOGO_SRC } from "./utils";

export const dynamic = "force-dynamic";

const ACCESS_STEPS: TranslationKey[] = ["home.access.step1", "home.access.step2", "home.access.step3"];

export async function generateMetadata(): Promise<Metadata> {
	const branding = await getHomeBranding();
	return {
		title: HOME_BRAND,
		icons: { icon: branding.hasCustomIcon ? "/api/branding/icon" : "/icon-96.png" },
	};
}

export default async function HomePage() {
	const [t, sessionUser] = await Promise.all([
		getServerTranslator(),
		// A session lookup failure must not take down the public landing page.
		getCurrentUser(getEnv()).catch(() => null),
	]);
	// Signed-in users skip the landing page; the inbox restores their last-used mailbox.
	if (sessionUser && !sessionUser.disabled) redirect("/inbox");

	// Render the signed-in account from the server response so the header does not
	// wait for hydration and an /api/auth/me round trip before showing it.
	const initialUser = sessionUser
		? {
			id: sessionUser.id,
			email: sessionUser.email,
			name: sessionUser.name,
			role: sessionUser.role,
			hasAvatar: !!sessionUser.avatarKey,
			calendarEnabled: sessionUser.calendarEnabled,
			driveEnabled: sessionUser.driveEnabled,
		}
		: null;

	// The brand is highlighted inside the translated headline, wherever each language places it.
	const [beforeBrand, afterBrand] = t("home.headline", { brand: "{brand}" }).split("{brand}");

	return (
		<HomeAuthProvider initialUser={initialUser}>
			<div className="flex min-h-dvh flex-col bg-background text-neutral-900">
				<header>
					<div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
						<Link href="/" className="flex min-w-0 items-center gap-2.5" aria-label={t("home.homeLabel", { app: HOME_BRAND })}>
							<img src={HOME_LOGO_SRC} width={54} height={36} alt="" className="h-9 w-auto shrink-0" />
							<span className="hidden truncate text-base font-semibold tracking-tight sm:inline">{HOME_BRAND}</span>
						</Link>

						<div className="flex shrink-0 items-center gap-2">
							<div className="hidden sm:block">
								<LanguageSelector variant="text" />
							</div>
							<HomeHeaderActions />
						</div>
					</div>
				</header>

				<main className="flex flex-1 items-center">
					<section className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-4 py-12 sm:px-6 md:py-20 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20 lg:px-8">
						<div className="max-w-2xl">
							<h1 className="max-w-[16ch] text-5xl font-semibold leading-[0.98] tracking-tight text-neutral-950 sm:text-6xl lg:text-7xl">
								{afterBrand === undefined ? beforeBrand : (
									<>
										{beforeBrand}
										<span className="text-blue-700">{HOME_BRAND}</span>
										{afterBrand}
									</>
								)}
							</h1>
							<p className="mt-6 max-w-xl text-lg leading-8 text-neutral-600">{t("home.subheadline")}</p>
							<HomeHeroActions />
						</div>

						<aside aria-labelledby="home-access-title" className="rounded-[1.75rem] border border-neutral-200 bg-white p-6 shadow-[0_24px_70px_-45px_rgba(30,64,175,0.55)] sm:p-8">
							<h2 id="home-access-title" className="text-xl font-semibold tracking-tight text-neutral-950">{t("home.access.title")}</h2>
							<p className="mt-2 text-sm leading-6 text-neutral-600">{t("home.access.description")}</p>
							<ol className="mt-6 divide-y divide-neutral-100 border-t border-neutral-100">
								{ACCESS_STEPS.map((key, index) => (
									<li key={key} className="flex items-start gap-4 py-4 last:pb-0">
										<span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-semibold text-blue-700">
											{index + 1}
										</span>
										<span className="pt-1 text-[15px] leading-6 text-neutral-800">{t(key, { brand: HOME_BRAND })}</span>
									</li>
								))}
							</ol>
						</aside>
					</section>
				</main>
			</div>
		</HomeAuthProvider>
	);
}
