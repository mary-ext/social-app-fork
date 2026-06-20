import { createContext, useContext, useMemo, useState } from 'react';
import type { LightboxImage } from '@oomfware/lightbox';

import type { ComposerOpts } from '#/lib/hooks/useOpenComposer';

import type { SessionAccount } from '#/state/session';

import * as Dialog from '#/components/Dialog';
import type { ReportSubject } from '#/components/moderation/ReportDialog';
import { type DialogHandle, useDialogHandle } from '#/components/web/Dialog';

type Control = Dialog.DialogControlProps;

/** Payload opening the global lightbox: the image list and the index to start on. */
export type LightboxPayload = { images: LightboxImage[]; index: number };

/** Detached handle for the global lightbox; open it with `lightboxControl.openWithPayload({ images, index })`. */
export type LightboxControl = DialogHandle<LightboxPayload>;

export type StatefulControl<T> = {
	control: Control;
	open: (value: T) => void;
	clear: () => void;
	value: T | undefined;
};

export type SigninDialogPayload = {
	requestedAccount?: SessionAccount;
	showStoredAccounts?: boolean;
};

/** Payload opening the global link-warning dialog: the destination and its visible text (optionally shared). */
export type LinkWarningPayload = {
	href: string;
	displayText: string;
	share?: boolean;
};

type ControlsContext = {
	/**
	 * The composer's Base UI {@link DialogHandle}-backed dialog. Opened from triggers all over the app (no
	 * declarative Trigger), so callers drive it imperatively — `openWithPayload(opts)` to open with the
	 * composer state, `isOpen` to test, `close()` to close — and read the active opts in the dialog tree via
	 * the `Dialog.Root` payload render-prop. The registry id is the constant `COMPOSER_DIALOG_ID`.
	 */
	composerDialogControl: DialogHandle<ComposerOpts>;
	lightboxControl: LightboxControl;
	mutedWordsDialogControl: Control;
	signinDialogControl: DialogHandle<SigninDialogPayload>;
	linkWarningDialogControl: DialogHandle<LinkWarningPayload>;
	reportDialogControl: StatefulControl<{ subject: ReportSubject }>;
};

const ControlsContext = createContext<ControlsContext | null>(null);
ControlsContext.displayName = 'GlobalDialogControlsContext';

export function useGlobalDialogsControlContext() {
	const ctx = useContext(ControlsContext);
	if (!ctx) {
		throw new Error('useGlobalDialogsControlContext must be used within a Provider');
	}
	return ctx;
}

export function Provider({ children }: React.PropsWithChildren<{}>) {
	const composerDialogControl = useDialogHandle<ComposerOpts>();
	const lightboxControl = useDialogHandle<LightboxPayload>();
	const mutedWordsDialogControl = Dialog.useDialogControl();
	const signinDialogControl = useDialogHandle<SigninDialogPayload>();
	const linkWarningDialogControl = useDialogHandle<LinkWarningPayload>();
	const reportDialogControl = useStatefulDialogControl<{
		subject: ReportSubject;
	}>();

	const ctx = useMemo<ControlsContext>(
		() => ({
			composerDialogControl,
			lightboxControl,
			mutedWordsDialogControl,
			signinDialogControl,
			linkWarningDialogControl,
			reportDialogControl,
		}),
		[
			composerDialogControl,
			lightboxControl,
			mutedWordsDialogControl,
			signinDialogControl,
			linkWarningDialogControl,
			reportDialogControl,
		],
	);

	return <ControlsContext.Provider value={ctx}>{children}</ControlsContext.Provider>;
}

export function useStatefulDialogControl<T>(initialValue?: T): StatefulControl<T> {
	const [value, setValue] = useState(initialValue);
	const control = Dialog.useDialogControl();
	return useMemo(
		() => ({
			control,
			open: (v: T) => {
				setValue(v);
				control.open();
			},
			clear: () => setValue(initialValue),
			value,
		}),
		[control, value, initialValue],
	);
}
