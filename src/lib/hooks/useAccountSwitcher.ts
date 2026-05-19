import {useCallback, useState} from 'react'
import {useLingui} from '@lingui/react/macro'

import {logger} from '#/logger'
import {
  type AccountLoggedInLogContext,
  type SessionAccount,
  useSessionApi,
} from '#/state/session'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import * as Toast from '#/components/Toast'

export function useAccountSwitcher() {
  const [pendingDid, setPendingDid] = useState<string | null>(null)
  const {t: l} = useLingui()
  const {resumeSession} = useSessionApi()
  const {signinDialogControl} = useGlobalDialogsControlContext()

  const onPressSwitchAccount = useCallback(
    async (account: SessionAccount, _logContext: AccountLoggedInLogContext) => {
      if (pendingDid) {
        // The session API isn't resilient to race conditions so let's just ignore this.
        return
      }
      try {
        setPendingDid(account.did)
        if (account.accessJwt) {
          // We're switching accounts, which remounts the entire app.
          // On mobile, this gets us Home, but on the web we also need reset the URL.
          // We can't change the URL via a navigate() call because the navigator
          // itself is about to unmount, and it calls pushState() too late.
          // So we change the URL ourselves. The navigator will pick it up on remount.
          history.pushState(null, '', '/')
          await resumeSession(account, true)
          Toast.show(l`Signed in as @${account.handle}`)
        } else {
          signinDialogControl.open({requestedAccount: account})
          Toast.show(l`Please sign in as @${account.handle}`, {
            type: 'warning',
          })
        }
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
    [l, resumeSession, signinDialogControl, pendingDid],
  )

  return {onPressSwitchAccount, pendingDid}
}
