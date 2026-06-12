import { lazy, Suspense, useRef } from 'react';
import { useLingui } from '@lingui/react/macro';

import { COMPOSER_DIALOG_ID } from '#/lib/hooks/useOpenComposer';

import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import { Spinner } from '#/components/Spinner';
import * as Dialog from '#/components/web/Dialog';

import { vars } from '#/styles/contract.css';

import type { CancelRef } from '../com/composer/Composer';
import * as styles from './Composer.css';

// the composer pulls in a large subtree (gif/emoji pickers, reanimated, media metadata, drafts), so it
// only loads when the dialog is first opened — the `payload && ...` guard already gates mounting.
const ComposePost = lazy(() => import('../com/composer/Composer').then((m) => ({ default: m.ComposePost })));

export function ComposerDialog() {
	const { t: l } = useLingui();
	const { composerDialogControl } = useGlobalDialogsControlContext();
	const cancelRef = useRef<CancelRef>(null);

	return (
		<Dialog.Root
			handle={composerDialogControl}
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
				<Dialog.Popup scroll="body" label={l`Write post`}>
					{payload && (
						<Suspense
							fallback={
								<div className={styles.placeholder}>
									<Spinner color={vars.palette.contrast_500} label={l`Loading`} />
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
