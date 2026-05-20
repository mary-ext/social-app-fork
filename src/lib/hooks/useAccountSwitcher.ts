import {useCallback, useState} from 'react'
import {useLingui} from '@lingui/react/macro'

import {logger} from '#/logger'
import {type SessionAccount, useSessionApi} from '#/state/session'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import * as Toast from '#/components/Toast'

export function useAccountSwitcher() {
  const [pendingDid, setPendingDid] = useState<string | null>(null)
  const {t: l} = useLingui()
  const {switchAccount} = useSessionApi()
  const {signinDialogControl} = useGlobalDialogsControlContext()

  const onPressSwitchAccount = useCallback(
    async (account: SessionAccount) => {
      if (pendingDid) {
        // The session API isn't resilient to race conditions so let's just ignore this.
        return
      }
      try {
        setPendingDid(account.did)
        await switchAccount(account)
      } catch (e) {
        logger.error(`switch account: selectAccount failed`, {
          message: e instanceof Error ? e.message : String(e),
        })
        signinDialogControl.open({requestedAccount: account})
        Toast.show(l`Please sign in as @${account.handle}`, {
          type: 'warning',
        })
      } finally {
        setPendingDid(null)
      }
    },
    [l, switchAccount, signinDialogControl, pendingDid],
  )

  return {onPressSwitchAccount, pendingDid}
}
