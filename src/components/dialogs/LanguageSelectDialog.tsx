import { type ComponentProps, lazy, Suspense } from 'react';

import * as Dialog from '#/components/Dialog';

const LanguageSelectDialogBody = lazy(() =>
	import('#/components/dialogs/LanguageSelectDialogBody').then((mod) => ({
		default: mod.LanguageSelectDialogBody,
	})),
);

export type LanguageSelectDialogProps = {
	handle: Dialog.DialogHandle;
	titleText: string;
	/** languages checked when the dialog opens. */
	currentLanguages: string[];
	onSelectLanguages: (languages: string[]) => void;
	maxLanguages?: number;
	/** focus target on close. `false` skips focus restoration. */
	finalFocus?: ComponentProps<typeof Dialog.Popup>['finalFocus'];
};

export function LanguageSelectDialog(props: LanguageSelectDialogProps) {
	const { handle, titleText, finalFocus } = props;

	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup finalFocus={finalFocus} height="fixed" label={titleText} scroll="body" size="wide">
				<Suspense fallback={<Dialog.Loading fill />}>
					<LanguageSelectDialogBody {...props} />
				</Suspense>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
