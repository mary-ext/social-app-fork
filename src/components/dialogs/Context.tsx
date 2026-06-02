import { createContext, useContext, useMemo, useState } from 'react';

import type { SessionAccount } from '#/state/session';
import type { ComposerOpts } from '#/state/shell/composer';

import * as Dialog from '#/components/Dialog';
import type { ReportSubject } from '#/components/moderation/ReportDialog';

type Control = Dialog.DialogControlProps;

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

type ControlsContext = {
	composerDialogControl: StatefulControl<ComposerOpts>;
	mutedWordsDialogControl: Control;
	signinDialogControl: StatefulControl<SigninDialogPayload>;
	linkWarningDialogControl: StatefulControl<{
		href: string;
		displayText: string;
		share?: boolean;
	}>;
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
	const composerDialogControl = useStatefulDialogControl<ComposerOpts>();
	const mutedWordsDialogControl = Dialog.useDialogControl();
	const signinDialogControl = useStatefulDialogControl<SigninDialogPayload>();
	const linkWarningDialogControl = useStatefulDialogControl<{
		href: string;
		displayText: string;
		share?: boolean;
	}>();
	const reportDialogControl = useStatefulDialogControl<{
		subject: ReportSubject;
	}>();

	const ctx = useMemo<ControlsContext>(
		() => ({
			composerDialogControl,
			mutedWordsDialogControl,
			signinDialogControl,
			linkWarningDialogControl,
			reportDialogControl,
		}),
		[composerDialogControl, mutedWordsDialogControl, signinDialogControl, linkWarningDialogControl, reportDialogControl],
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
