import { lazy, Suspense } from 'react';

import * as Dialog from '#/components/Dialog';

import type { LabelsOnMeDialogProps } from './LabelsOnMeDialogBody';

const LabelsOnMeDialogBody = lazy(() =>
	import('./LabelsOnMeDialogBody').then((mod) => ({ default: mod.LabelsOnMeDialogBody })),
);

export function LabelsOnMeDialog(props: LabelsOnMeDialogProps) {
	return (
		<Dialog.Root handle={props.handle}>
			<Dialog.Popup size="wide">
				<Suspense fallback={<Dialog.Loading />}>
					<LabelsOnMeDialogBody {...props} />
				</Suspense>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
