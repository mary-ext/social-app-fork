import { lazy, Suspense } from 'react';

import * as Dialog from '#/components/Dialog';

import { m } from '#/paraglide/messages';

const FollowCleanupDialogContent = lazy(() =>
	import('./FollowCleanupDialogContent').then((mod) => ({ default: mod.FollowCleanupDialogContent })),
);

/** lets the current account review and remove follows that are no longer visible. */
export const FollowCleanupDialog = ({ handle }: { handle: Dialog.DialogHandle }) => {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup height="tall" label={m['components.followCleanupDialog.title']()} scroll="body">
				<Suspense
					fallback={
						<Dialog.Body>
							<Dialog.Loading fill />
						</Dialog.Body>
					}
				>
					<FollowCleanupDialogContent />
				</Suspense>
			</Dialog.Popup>
		</Dialog.Root>
	);
};
