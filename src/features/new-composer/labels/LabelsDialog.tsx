import { lazy, type ReactNode, Suspense } from 'react';

import type { SelfLabel } from '#/lib/moderation/self-labels';

import * as Dialog from '#/components/Dialog';

const LabelsDialogBody = lazy(() =>
	import('./LabelsDialogBody').then((mod) => ({ default: mod.LabelsDialogBody })),
);

/** current labels supplied in the dialog's opening payload. */
export type LabelsTarget = {
	labels: readonly SelfLabel[];
};

/**
 * edits content warnings; dismissing without saving discards changes.
 *
 * @param props.handle the dialog's handle
 * @param props.onSave receives replacement labels and the original opening payload
 * @returns the dialog
 */
export const LabelsDialog = <T extends LabelsTarget>({
	handle,
	onSave,
}: {
	handle: Dialog.DialogHandle<T>;
	onSave: (labels: SelfLabel[], target: T) => void;
}): ReactNode => {
	return (
		<Dialog.Root handle={handle}>
			{({ payload }) => (
				<Dialog.Popup scroll="body" size="medium">
					{payload && (
						<Suspense fallback={<Dialog.Loading />}>
							<LabelsDialogBody
								labels={payload.labels}
								onSave={(next) => {
									onSave(next, payload);
									handle.close();
								}}
							/>
						</Suspense>
					)}
				</Dialog.Popup>
			)}
		</Dialog.Root>
	);
};
