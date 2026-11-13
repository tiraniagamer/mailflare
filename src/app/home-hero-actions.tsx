"use client";

import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useHomeAuth } from "./home-auth";
import { HOME_PRIMARY_BUTTON_CLASS } from "./utils";

export function HomeHeroActions() {
	const { t } = useLanguage();
	const hasUser = !!useHomeAuth();

	return (
		<div className="mt-8">
			<Button size="lg" asChild className={cn("rounded-full px-6", HOME_PRIMARY_BUTTON_CLASS)}>
				<Link href={hasUser ? "/inbox" : "/login"}>
					{hasUser ? t("home.openDashboard") : t("home.logIn")}
					<ArrowRight className="h-4 w-4" />
				</Link>
			</Button>
		</div>
	);
}
