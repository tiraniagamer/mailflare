"use client";

import Link from "next/link";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { HomeAccountMenu } from "./home-account-menu";
import { useHomeAuth } from "./home-auth";
import { HOME_PRIMARY_BUTTON_CLASS } from "./utils";

export function HomeHeaderActions() {
	const { t } = useLanguage();
	const user = useHomeAuth();
	if (user) return <HomeAccountMenu user={user} />;

	return (
		<Button asChild className={HOME_PRIMARY_BUTTON_CLASS}>
			<Link href="/login">{t("home.logIn")}</Link>
		</Button>
	);
}
