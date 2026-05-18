import {useCallback, useState} from 'react'
import {msg} from '@lingui/core/macro'
import {useLingui} from '@lingui/react'

import {web} from '#/alf'
import * as Dialog from '#/components/Dialog'
import {type StatefulControl} from '#/components/dialogs/Context'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {Manage2FA} from '#/components/dialogs/EmailDialog/screens/Manage2FA'
import {Update} from '#/components/dialogs/EmailDialog/screens/Update'
import {type Screen, ScreenID} from '#/components/dialogs/EmailDialog/types'

export type {Screen} from '#/components/dialogs/EmailDialog/types'
export {ScreenID as EmailDialogScreenID} from '#/components/dialogs/EmailDialog/types'

export function useEmailDialogControl() {
  return useGlobalDialogsControlContext().emailDialogControl
}

export function EmailDialog() {
  const {_} = useLingui()
  const emailDialogControl = useEmailDialogControl()
  const onClose = useCallback(() => {
    emailDialogControl.clear()
  }, [emailDialogControl])

  return (
    <Dialog.Outer control={emailDialogControl.control} onClose={onClose}>
      <Dialog.Handle />

      <Dialog.ScrollableInner
        label={_(msg`Make adjustments to email settings for your account`)}
        style={web({maxWidth: 400})}>
        <Inner control={emailDialogControl} />
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function Inner({control}: {control: StatefulControl<Screen>}) {
  const [screen, showScreen] = useState(() => control.value)

  if (!screen) return null

  switch (screen.id) {
    case ScreenID.Update: {
      return <Update config={screen} showScreen={showScreen} />
    }
    case ScreenID.Manage2FA: {
      return <Manage2FA config={screen} showScreen={showScreen} />
    }
    default: {
      return null
    }
  }
}
