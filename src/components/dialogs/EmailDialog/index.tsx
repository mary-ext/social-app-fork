import {useCallback, useState} from 'react'
import {useLingui} from '@lingui/react/macro'

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
  const {t: l} = useLingui()
  const emailDialogControl = useEmailDialogControl()
  const onClose = useCallback(() => {
    emailDialogControl.clear()
  }, [emailDialogControl])

  return (
    <Dialog.Outer control={emailDialogControl.control} onClose={onClose}>
      <Dialog.Handle />
      <Dialog.ScrollableInner
        label={l`Make adjustments to email settings for your account`}
        style={{maxWidth: 400} as any}>
        <Inner control={emailDialogControl} />
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  );
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
