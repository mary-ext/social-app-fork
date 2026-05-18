import {type DialogControlProps} from '#/components/Dialog'

export type EmailDialogProps = {
  control: DialogControlProps
}

export type EmailDialogInnerProps = EmailDialogProps & {}

export type Screen =
  | {
      id: ScreenID.Update
    }
  | {
      id: ScreenID.Manage2FA
    }

export enum ScreenID {
  Update = 'Update',
  Manage2FA = 'Manage2FA',
}

export type ScreenProps<T extends ScreenID> = {
  config: Extract<Screen, {id: T}>
  showScreen: (screen: Screen) => void
}
