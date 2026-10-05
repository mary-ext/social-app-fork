import { lazy, Suspense } from 'react';

import type { InteractionSettings } from '#/lib/interaction-settings';

import * as Dialog from '#/components/Dialog';

const DraftSettingsBody = lazy(() =>
	import('./DraftSettingsBody').then((mod) => ({ default: mod.DraftSettingsBody })),
);

export type DraftInteractionSettingsDialogProps = {
	handle: Dialog.DialogHandle;
	value: InteractionSettings;
	onSave: (value: InteractionSettings) => void;
};

/**
 * edits a draft thread's settings, with an option to save account defaults. closing discards unsaved edits.
 *
 * @param props.handle the dialog handle
 * @param props.value the thread's current settings
 * @param props.onSave receives the edited settings when they differ from `value`
 * @returns the dialog
 */
export function DraftInteractionSettingsDialog(props: DraftInteractionSettingsDialogProps) {
	return (
		<Dialog.Root handle={props.handle}>
			<Dialog.Popup height="fixed" scroll="body" size="medium">
				<Suspense fallback={<Dialog.Loading fill />}>
					<DraftSettingsBody {...props} />
				</Suspense>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
