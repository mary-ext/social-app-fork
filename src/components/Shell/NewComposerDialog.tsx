import { lazy, Suspense } from 'react';

import * as Dialog from '#/components/Dialog';
import { newComposerDialogHandle } from '#/components/dialogs/handles';
import { Spinner } from '#/components/Spinner';

import { m } from '#/paraglide/messages';

import * as styles from './NewComposerDialog.css';

const NewComposer = lazy(() =>
	import('#/features/new-composer/NewComposer').then((mod) => ({ default: mod.NewComposer })),
);

export function NewComposerDialog() {
	return (
		<Dialog.Root handle={newComposerDialogHandle}>
			{({ payload }) => (
				<Dialog.Popup label={m['common.compose.action.write']()} padding="none" scroll="body">
					<Dialog.Header.Root border="scrolling">
						<Dialog.Header.Close />
						<Dialog.Header.Title>{m['view.composer.title.post']()}</Dialog.Header.Title>
					</Dialog.Header.Root>
					<Dialog.Body>
						{payload && (
							<Suspense
								fallback={
									<div className={styles.placeholder}>
										<Spinner color="default" label={m['common.status.loading']()} />
									</div>
								}
							>
								<NewComposer />
							</Suspense>
						)}
					</Dialog.Body>
				</Dialog.Popup>
			)}
		</Dialog.Root>
	);
}
