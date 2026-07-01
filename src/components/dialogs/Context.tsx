import { createContext, useContext } from 'react';
import type { LightboxImage } from '@oomfware/lightbox';

import type { ComposerOpts } from '#/lib/hooks/useOpenComposer';

import type { SessionAccount } from '#/state/session';

import type { ReportSubject } from '#/components/moderation/ReportDialog';
import { type DialogHandle, useDialogHandle } from '#/components/web/Dialog';

/** the images and the index to open the global lightbox on. */
export type LightboxPayload = { images: LightboxImage[]; index: number };

/** detached handle for the global lightbox. */
export type LightboxHandle = DialogHandle<LightboxPayload>;

export type SigninDialogPayload = {
	/** whether the chooser frames itself as signing in (default) or switching the active account. */
	intent?: 'signin' | 'switch';
	requestedAccount?: SessionAccount;
	showStoredAccounts?: boolean;
};

/** the destination and its visible text for the global link-warning dialog. */
export type LinkWarningPayload = {
	href: string;
	displayText: string;
	share?: boolean;
};

type HandlesContext = {
	/** the app-wide composer dialog, opened imperatively (no declarative trigger). */
	composerDialogHandle: DialogHandle<ComposerOpts>;
	/** the group-chat join dialog. */
	groupChatJoinHandle: DialogHandle<{ code: string }>;
	lightboxHandle: LightboxHandle;
	signinDialogHandle: DialogHandle<SigninDialogPayload>;
	linkWarningDialogHandle: DialogHandle<LinkWarningPayload>;
	reportDialogHandle: DialogHandle<{ subject: ReportSubject }>;
};

const HandlesContext = createContext<HandlesContext | null>(null);
HandlesContext.displayName = 'GlobalDialogHandlesContext';

export function useGlobalDialogsHandleContext() {
	const ctx = useContext(HandlesContext);
	if (!ctx) {
		throw new Error('useGlobalDialogsHandleContext must be used within a Provider');
	}
	return ctx;
}

export function Provider({ children }: React.PropsWithChildren<{}>) {
	const composerDialogHandle = useDialogHandle<ComposerOpts>();
	const groupChatJoinHandle = useDialogHandle<{ code: string }>();
	const lightboxHandle = useDialogHandle<LightboxPayload>();
	const signinDialogHandle = useDialogHandle<SigninDialogPayload>();
	const linkWarningDialogHandle = useDialogHandle<LinkWarningPayload>();
	const reportDialogHandle = useDialogHandle<{ subject: ReportSubject }>();

	const ctx: HandlesContext = {
		composerDialogHandle,
		groupChatJoinHandle,
		lightboxHandle,
		signinDialogHandle,
		linkWarningDialogHandle,
		reportDialogHandle,
	};

	return <HandlesContext.Provider value={ctx}>{children}</HandlesContext.Provider>;
}
