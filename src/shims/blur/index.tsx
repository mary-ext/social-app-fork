import {View, type ViewProps} from 'react-native'

export type BlurViewProps = ViewProps & {
  intensity?: number
  tint?:
    | 'light'
    | 'dark'
    | 'default'
    | 'systemMaterial'
    | 'systemMaterialDark'
    | 'systemMaterialLight'
}

export function BlurView({intensity = 50, style, tint, ...props}: BlurViewProps) {
  const alpha = tint === 'dark' ? 0.24 : 0.12
  return (
    <View
      {...props}
      style={[
        {
          backdropFilter: `blur(${Math.max(0, intensity) / 5}px)`,
          WebkitBackdropFilter: `blur(${Math.max(0, intensity) / 5}px)`,
          backgroundColor: `rgba(255, 255, 255, ${alpha})`,
        } as ViewProps['style'],
        style,
      ]}
    />
  )
}
