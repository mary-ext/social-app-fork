import {useState} from 'react'

import {useAccountEmailState} from '#/components/dialogs/EmailDialog/data/useAccountEmailState'
import {Disable} from '#/components/dialogs/EmailDialog/screens/Manage2FA/Disable'
import {Enable} from '#/components/dialogs/EmailDialog/screens/Manage2FA/Enable'
import {
  ScreenID,
  type ScreenProps,
} from '#/components/dialogs/EmailDialog/types'

export function Manage2FA(_props: ScreenProps<ScreenID.Manage2FA>) {
  const {email2FAEnabled} = useAccountEmailState()
  const [requestedAction, setRequestedAction] = useState<
    'enable' | 'disable' | null
  >(null)

  /*
   * Wacky state handling so that once 2FA settings change, we don't show the
   * wrong step of this form - esb
   */

  if (email2FAEnabled) {
    if (!requestedAction) {
      setRequestedAction('disable')
      return <Disable />
    }

    if (requestedAction === 'disable') {
      return <Disable />
    }
    if (requestedAction === 'enable') {
      return <Enable />
    }
  } else {
    if (!requestedAction) {
      setRequestedAction('enable')
      return <Enable />
    }

    if (requestedAction === 'disable') {
      return <Disable />
    }
    if (requestedAction === 'enable') {
      return <Enable />
    }
  }

  // should never happen
  return null
}
