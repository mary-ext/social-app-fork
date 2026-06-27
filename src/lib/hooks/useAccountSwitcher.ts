import { useCallback, useState } from 'react';

import { type SessionAccount, useSessionApi } from '#/state/session';

import { logger } from '#/logger';

import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

export function useAccountSwitcher() {
	const [pendingDid, setPendingDid] = useState<string | null>(null);
	const { switchAccount } = useSessionApi();
	const { signinDialogControl } = useGlobalDialogsControlContext();

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
				logger.error(`switch account: selectAccount failed`, {
					message: e instanceof Error ? e.message : String(e),
				});
				signinDialogControl.openWithPayload({ requestedAccount: account });
				Toast.show(m['lib.error.signInAs']({ handle: account.handle }), {
					type: 'warning',
				});
			} finally {
				setPendingDid(null);
			}
		},
		[switchAccount, signinDialogControl, pendingDid],
	);

	return { onPressSwitchAccount, pendingDid };
}
