import { lazy, Suspense } from 'react';

import * as Dialog from '#/components/Dialog';
import { Spinner } from '#/components/Spinner';

import { m } from '#/paraglide/messages';

import * as styles from './index.css';

const FollowCleanupDialogContent = lazy(() =>
	import('./FollowCleanupDialogContent').then((mod) => ({ default: mod.FollowCleanupDialogContent })),
);

/** lets the current account review and remove follows that are no longer visible. */
export const FollowCleanupDialog = ({ handle }: { handle: Dialog.DialogHandle }) => {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup fullHeight scroll="body" label={m['components.followCleanupDialog.title']()}>
				<Suspense
					fallback={
						<Dialog.Body className={styles.loading}>
							<Spinner color="default" label={m['common.status.loading']()} size="xl" />
						</Dialog.Body>
					}
				>
					<FollowCleanupDialogContent handle={handle} />
				</Suspense>
			</Dialog.Popup>
		</Dialog.Root>
	);
};
