'use no memo'; // composition props usually invalidate the generated wrapper caches

import { Root as DialogRoot, type RootProps as DialogRootProps } from '../dialog/Root';

export type RootProps<Payload = void> = Omit<DialogRootProps<Payload>, 'disablePointerDismissal'>;

/**
 * shares alert-dialog state. outside presses do not close it; Escape and platform close requests do.
 *
 * @param props alert dialog parts, open state, and callbacks
 * @returns the alert dialog parts without a wrapper element
 */
export const Root = <Payload = void,>(props: RootProps<Payload>) => {
	return <DialogRoot {...props} disablePointerDismissal />;
};
