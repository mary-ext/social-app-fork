import type { AuthAccount } from '#/storage';

export type SessionAccount = AuthAccount;

export type SessionStateContext = {
	accounts: readonly SessionAccount[];
	currentAccount: SessionAccount | undefined;
	hasSession: boolean;
	/** True while the boot-time session resume is in flight. */
	isSessionResuming: boolean;
	/** True when the boot-time resume failed because the session was rejected. */
	sessionResumeFailed: boolean;
};
