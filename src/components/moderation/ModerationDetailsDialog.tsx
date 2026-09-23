import { lazy, Suspense } from 'react';

import * as Dialog from '#/components/Dialog';

import type { ModerationDetailsDialogProps } from './ModerationDetailsDialogBody';

const ModerationDetailsDialogBody = lazy(() =>
	import('./ModerationDetailsDialogBody').then((mod) => ({ default: mod.ModerationDetailsDialogBody })),
);

/** shows the details behind a moderation cause. */
export function ModerationDetailsDialog({ handle, modcause }: ModerationDetailsDialogProps) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup padding="none" size="medium">
				<Suspense fallback={<Dialog.Loading />}>
					<ModerationDetailsDialogBody handle={handle} modcause={modcause} />
				</Suspense>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
