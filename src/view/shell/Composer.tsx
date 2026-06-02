import * as Dialog from '#/components/Dialog';
import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';

import { ComposePost, useComposerCancelRef } from '../com/composer/Composer';

export function ComposerDialog() {
	const { composerDialogControl } = useGlobalDialogsControlContext();
	const cancelRef = useComposerCancelRef();
	const state = composerDialogControl.value;

	return (
		<Dialog.Outer
			control={composerDialogControl.control}
			onClose={composerDialogControl.clear}
			webOptions={{
				// ESC routes through ComposePost's own `onDismiss`; the backdrop press lives on the
				// Outer (outside ComposePost), so it has to be forwarded into the same cancel path.
				onBackgroundPress: () => cancelRef.current?.onPressCancel(),
			}}
		>
			{state && <ComposePost cancelRef={cancelRef} {...state} />}
		</Dialog.Outer>
	);
}
