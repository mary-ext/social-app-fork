import type { AuthAccount } from '#/storage';

export type SessionAccount = AuthAccount;

export type SessionStateContext = {
	accounts: readonly SessionAccount[];
	currentAccount: SessionAccount | undefined;
	hasSession: boolean;
	/** true while boot-time session resume is in flight. */
	isSessionResuming: boolean;
	/** true when boot-time resume was rejected. */
	sessionResumeFailed: boolean;
};
