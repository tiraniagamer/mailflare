import type { Branding } from "@/lib/branding/types";

export const DEFAULT_BRANDING: Branding = {
	appName: "Mailflare",
	hasCustomIcon: false,
	// Branding is never license-locked in this fork, so a failed request must not show the lock card.
	canCustomizeBranding: true,
};

export async function fetchBranding(): Promise<Branding> {
	const response = await fetch("/api/branding", { cache: "no-store" });
	if (!response.ok) return DEFAULT_BRANDING;
	return (await response.json()) as Branding;
}
