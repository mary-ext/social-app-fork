import {
  type AccessibilityProps,
  type AccessibilityRole,
  type GestureResponderEvent,
  type PressableProps,
} from 'react-native'

import {type TextStyleProp, type ViewStyleProp} from '#/alf'
import type * as Dialog from '#/components/Dialog'
import {type Props as SVGIconProps} from '#/components/icons/common'

export type ContextType = {
  control: Dialog.DialogOuterProps['control']
}

export type ItemContextType = {
  disabled: boolean
  destructive: boolean
}

export type RadixPassThroughTriggerProps = {
  ref: React.RefObject<any>
  id: string
  type: 'button'
  disabled: boolean
  ['data-disabled']: boolean
  ['data-state']: string
  ['aria-controls']?: string
  ['aria-haspopup']?: boolean
  ['aria-expanded']?: AccessibilityProps['aria-expanded']
  onKeyDown: (e: React.KeyboardEvent) => void
  /**
   * Radix provides this, but we override on web to use `onPress` instead,
   * which is less sensitive while scrolling.
   */
  onPointerDown: PressableProps['onPointerDown']
}
export type TriggerProps = {
  children(props: TriggerChildProps): React.ReactNode
  label: string
  contentLabel?: string
  hint?: string
  role?: AccessibilityRole
}
export type TriggerChildProps = {
  control: Dialog.DialogOuterProps['control']
  state: {
    hovered: boolean
    focused: boolean
    pressed: false
  }
  props: Omit<RadixPassThroughTriggerProps, 'disabled'> & {
    onPress: () => void
    onFocus: () => void
    onBlur: () => void
    onMouseEnter: () => void
    onMouseLeave: () => void
    accessibilityHint?: string
    accessibilityLabel: string
    accessibilityRole: AccessibilityRole
  }
}

export type ItemProps = React.PropsWithChildren<
  Omit<PressableProps, 'style'> &
    ViewStyleProp & {
      label: string
      onPress: (e: GestureResponderEvent) => void
      destructive?: boolean
    }
>

export type ItemTextProps = React.PropsWithChildren<TextStyleProp & {}>
export type ItemIconProps = React.PropsWithChildren<{
  icon: React.ComponentType<SVGIconProps>
  position?: 'left' | 'right'
  fill?: (props: {disabled: boolean}) => string
}>

export type GroupProps = React.PropsWithChildren<ViewStyleProp & {}>
