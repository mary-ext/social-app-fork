import { lazy, Suspense, useRef } from 'react';

import type { ComposerCloseGuard } from '#/features/new-composer/NewComposer';

import * as Dialog from '#/components/Dialog';
import { newComposerDialogHandle } from '#/components/dialogs/handles';
import { Spinner } from '#/components/Spinner';

import { m } from '#/paraglide/messages';

import * as styles from './NewComposerDialog.css';

const NewComposer = lazy(() =>
	import('#/features/new-composer/NewComposer').then((mod) => ({ default: mod.NewComposer })),
);

export function NewComposerDialog() {
	const closeGuardRef = useRef<ComposerCloseGuard>(null);

	return (
		<Dialog.Root
			handle={newComposerDialogHandle}
			onOpenChange={(open, details) => {
				// confirmed discards close imperatively; don't prompt again.
				if (!open && details.reason !== 'imperative-action' && closeGuardRef.current?.interceptClose()) {
					details.cancel();
				}
			}}
		>
			{({ payload }) => (
				<Dialog.Popup label={m['common.compose.action.write']()} padding="none" scroll="body">
					{payload && (
						<Suspense
							fallback={
								<Dialog.Body>
									<div className={styles.placeholder}>
										<Spinner color="default" label={m['common.status.loading']()} />
									</div>
								</Dialog.Body>
							}
						>
							<NewComposer
								quoteUri={payload.quote?.uri}
								replyUri={payload.replyTo?.uri}
								initialText={payload.text}
								initialVideo={payload.videoUri}
								closeGuardRef={closeGuardRef}
							/>
						</Suspense>
					)}
				</Dialog.Popup>
			)}
		</Dialog.Root>
	);
}
