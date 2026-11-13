"use client";

import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { useHomeAuth } from "./home-auth";
import { HOME_BRAND } from "./utils";

export function HomeHeroActions() {
	const { t } = useLanguage();
	const hasUser = !!useHomeAuth();

	return (
		<div className="mt-8 flex flex-col items-start gap-4">
			<Button size="lg" asChild className="rounded-full px-6">
				<Link href={hasUser ? "/inbox" : "/login"}>
					{hasUser ? t("home.openDashboard") : t("home.logIn")}
					<ArrowRight className="h-4 w-4" />
				</Link>
			</Button>
			{!hasUser && <p className="text-sm text-neutral-500">{t("home.noAccount", { brand: HOME_BRAND })}</p>}
		</div>
	);
}
