import {View, type ViewProps} from 'react-native'

export type GlassViewProps = ViewProps & {
  colorScheme?: 'light' | 'dark'
  glassEffectStyle?: string
  isInteractive?: boolean
  tintColor?: string
}

export type GlassContainerProps = ViewProps & {
  spacing?: number
}

export function isGlassEffectAPIAvailable() {
  return false
}

export function isLiquidGlassAvailable() {
  return false
}

export function GlassView({
  colorScheme,
  glassEffectStyle,
  isInteractive,
  tintColor,
  ...props
}: GlassViewProps) {
  void colorScheme
  void glassEffectStyle
  void isInteractive
  void tintColor
  return <View {...props} />
}

export function GlassContainer({spacing, ...props}: GlassContainerProps) {
  void spacing
  return <View {...props} />
}
