import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, HardDrive, Mail } from "@/components/icons";
import { getServerTranslator } from "@/lib/i18n/server";
import { getCurrentUser } from "@/lib/auth/cookies";
import { getEnv } from "@/lib/cloudflare";
import { LanguageSelector } from "@/components/language-selector";
import { getHomeBranding } from "./home-server-utils";
import { HomeAuthProvider } from "./home-auth";
import { HomeHeaderActions } from "./home-header-actions";
import { HomeHeroActions } from "./home-hero-actions";
import { HOME_BRAND } from "./utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
	const branding = await getHomeBranding();
	return {
		title: HOME_BRAND,
		icons: { icon: branding.hasCustomIcon ? "/api/branding/icon" : "/icon-96.png" },
	};
}

/** The uploaded brand icon, or a "TG" monogram while the installation still has the default icon. */
function BrandMark({ hasCustomIcon, size, className }: { hasCustomIcon: boolean; size: number; className: string }) {
	if (hasCustomIcon) return <img src="/api/branding/icon" height={size} width={size} alt="" className={className} />;
	return (
		<span aria-hidden="true" style={{ width: size, height: size }} className={`flex items-center justify-center bg-blue-950 font-black tracking-tight text-white ${className}`}>
			TG
		</span>
	);
}

export default async function HomePage() {
	const [branding, t, sessionUser] = await Promise.all([
		getHomeBranding(),
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
	const products = [
		{ icon: Mail, label: t("home.mockMail") },
		{ icon: CalendarDays, label: t("calendar.calendar") },
		{ icon: HardDrive, label: t("drive.title") },
	];

	return (
		<HomeAuthProvider initialUser={initialUser}>
			<div className="flex min-h-dvh flex-col bg-[#f6f8fc] text-neutral-900">
				<header className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
					<Link href="/" className="flex min-w-0 items-center gap-3" aria-label={t("home.homeLabel", { app: HOME_BRAND })}>
						<BrandMark hasCustomIcon={branding.hasCustomIcon} size={32} className="shrink-0 rounded-lg text-xs" />
						<span className="truncate text-base font-bold tracking-tight">{HOME_BRAND}</span>
					</Link>

					<div className="flex shrink-0 items-center gap-2">
						<div className="hidden sm:block">
							<LanguageSelector variant="text" />
						</div>
						<HomeHeaderActions />
					</div>
				</header>

				<main className="flex flex-1 items-center">
					<section className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-4 pb-12 pt-8 sm:px-6 md:pt-12 lg:grid-cols-[1fr_0.9fr] lg:gap-16 lg:px-8">
						<div className="flex max-w-2xl flex-col justify-center">
							<h1 className="max-w-[14ch] text-5xl font-bold leading-[0.98] tracking-tight text-neutral-950 sm:text-6xl lg:text-7xl">
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

						<div className="flex min-h-[360px] flex-col justify-between gap-10 overflow-hidden rounded-[2rem] bg-blue-950 p-8 text-white sm:min-h-[440px] sm:p-10 lg:min-h-[520px]">
							<BrandMark hasCustomIcon={branding.hasCustomIcon} size={80} className="rounded-2xl text-3xl ring-1 ring-white/20" />
							<p aria-hidden="true" className="text-[clamp(3.5rem,11vw,7rem)] font-black leading-[0.85] tracking-tighter">
								<span className="block">Tiranía</span>
								<span className="block text-blue-300">Gamer</span>
							</p>
							<ul className="flex flex-wrap gap-x-6 gap-y-3 border-t border-white/15 pt-6 text-sm font-medium text-blue-100">
								{products.map(({ icon: Icon, label }) => (
									<li key={label} className="flex items-center gap-2">
										<Icon className="h-4 w-4" />
										{label}
									</li>
								))}
							</ul>
						</div>
					</section>
				</main>
			</div>
		</HomeAuthProvider>
	);
}
