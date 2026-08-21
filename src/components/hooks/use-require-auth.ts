import { useSession } from '#/state/session';

import { signinDialogHandle } from '#/components/dialogs/handles';

/** @returns an auth-gated action runner. */
export function useRequireAuth() {
	const { hasSession } = useSession();

	return (fn: () => unknown) => {
		if (hasSession) {
			fn();
		} else {
			signinDialogHandle.openWithPayload({});
		}
	};
}
