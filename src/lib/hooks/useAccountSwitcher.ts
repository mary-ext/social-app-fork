import { useCallback, useState } from 'react';

import { switchAccount, type SessionAccount } from '#/state/session';

import { signinDialogHandle } from '#/components/dialogs/handles';
import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

export function useAccountSwitcher() {
	const [pendingDid, setPendingDid] = useState<string | null>(null);

	const onPressSwitchAccount = useCallback(
		async (account: SessionAccount) => {
			if (pendingDid) {
				// The session API isn't resilient to race conditions so let's just ignore this.
				return;
			}
			try {
				setPendingDid(account.did);
				await switchAccount(account);
			} catch (e) {
				console.error('switch account: selectAccount failed', e);
				signinDialogHandle.openWithPayload({ requestedAccount: account });
				Toast.show(m['lib.error.signInAs']({ handle: account.handle }), {
					type: 'warning',
				});
			} finally {
				setPendingDid(null);
			}
		},
		[pendingDid],
	);

	return { onPressSwitchAccount, pendingDid };
}
