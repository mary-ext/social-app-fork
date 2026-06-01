import { type AuthAccount } from '#/storage';

export type SessionAccount = AuthAccount;

export type SessionStateContext = {
	accounts: SessionAccount[];
	currentAccount: SessionAccount | undefined;
	hasSession: boolean;
	/** True while the boot-time session resume is in flight. */
	isSessionResuming: boolean;
	/** True when the boot-time resume failed because the session was rejected. */
	sessionResumeFailed: boolean;
};

export type SessionApiContext = {
	completeOAuthCallback: (params: URLSearchParams) => Promise<void>;
	login: (props: { identifier: string }) => Promise<void>;
	logoutCurrentAccount: () => void;
	logoutEveryAccount: () => void;
	removeAccount: (account: SessionAccount) => void;
	/**
	 * Validates the account's stored session, persists it as the current account, and reloads the page to apply
	 * the switch.
	 */
	switchAccount: (account: SessionAccount) => Promise<void>;
};
