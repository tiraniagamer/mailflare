import type { MailboxSelectorUser } from "@/components/mailbox-selector-types";
import type { ReactNode } from "react";

export type HomeAuthProviderProps = {
	children: ReactNode;
	/**
	 * The account resolved from the session cookie on the server. `undefined`
	 * means the server did not answer, so the provider must check itself.
	 */
	initialUser?: MailboxSelectorUser | null;
};

export type HomeAccountMenuProps = {
	user: MailboxSelectorUser;
};
