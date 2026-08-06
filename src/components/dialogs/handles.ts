import type { LightboxImage } from '@oomfware/lightbox';

import { Dialog } from '@base-ui/react/dialog';

import type { SessionAccount } from '#/state/session';

import type { ComposerOpts } from '#/features/composer/open-composer';

import type { ReportSubject } from '#/components/moderation/ReportDialog/types';

/** the images and the index to open the global lightbox on. */
export type LightboxPayload = { images: LightboxImage[]; index: number };

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

export const composerDialogHandle = Dialog.createHandle<ComposerOpts>();

export const groupChatJoinHandle = Dialog.createHandle<{ code: string }>();

export const lightboxHandle = Dialog.createHandle<LightboxPayload>();

export const linkWarningDialogHandle = Dialog.createHandle<LinkWarningPayload>();

export const reportDialogHandle = Dialog.createHandle<{ subject: ReportSubject }>();

export const signinDialogHandle = Dialog.createHandle<SigninDialogPayload>();
