import { useLingui } from '@lingui/react/macro';

import { COMPOSER_DIALOG_ID } from '#/lib/hooks/useOpenComposer';

import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import * as Sheet from '#/components/web/Sheet';

import { ComposePost, useComposerCancelRef } from '../com/composer/Composer';

export function ComposerDialog() {
	const { t: l } = useLingui();
	const { composerDialogControl } = useGlobalDialogsControlContext();
	const cancelRef = useComposerCancelRef();

	return (
		<Sheet.Root
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
				<Sheet.Popup label={l`Write post`}>
					{payload && <ComposePost cancelRef={cancelRef} {...payload} />}
				</Sheet.Popup>
			)}
		</Sheet.Root>
	);
}
