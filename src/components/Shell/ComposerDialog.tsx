import { lazy, Suspense, useRef } from 'react';

import { COMPOSER_DIALOG_ID } from '#/lib/hooks/useOpenComposer';

import type { CancelRef } from '#/features/composer/Composer';

import * as Dialog from '#/components/Dialog';
import { composerDialogHandle } from '#/components/dialogs/handles';
import { Spinner } from '#/components/Spinner';

import { m } from '#/paraglide/messages';

import * as styles from './ComposerDialog.css';

// the composer pulls in a large subtree (gif/emoji pickers, reanimated, media metadata, drafts), so it
// only loads when the dialog is first opened — the `payload && ...` guard already gates mounting.
const ComposePost = lazy(() =>
	import('#/features/composer/Composer').then((mod) => ({ default: mod.ComposePost })),
);

export function ComposerDialog() {
	const cancelRef = useRef<CancelRef>(null);

	return (
		<Dialog.Root
			handle={composerDialogHandle}
			id={COMPOSER_DIALOG_ID}
			onOpenChange={(open, details) => {
				// Imperative closes (publish, Cancel button, confirmed discard) pass through; Base UI clears
				// the payload on close. ESC / backdrop-press route through ComposePost's cancel flow, which
				// vetoes the close (keeping the composer open) when it raises the discard prompt or closes a
				// sub-popup.
				if (!open && details.reason !== 'imperative-action' && cancelRef.current?.onPressCancel()) {
					details.cancel();
				}
			}}
		>
			{({ payload }) => (
				<Dialog.Popup scroll="body" label={m['common.compose.action.write']()}>
					{payload && (
						<Suspense
							fallback={
								<div className={styles.placeholder}>
									<Spinner color="default" label={m['common.status.loading']()} />
								</div>
							}
						>
							<ComposePost cancelRef={cancelRef} {...payload} />
						</Suspense>
					)}
				</Dialog.Popup>
			)}
		</Dialog.Root>
	);
}
