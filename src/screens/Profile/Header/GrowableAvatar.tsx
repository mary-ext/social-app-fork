import {type StyleProp, View, type ViewStyle} from 'react-native'

import Animated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedStyle,
} from '#/lib/animations/reanimatedCompat'
import {usePagerHeaderContext} from '#/view/com/pager/PagerHeaderContext'

export function GrowableAvatar({
  children,
  style,
}: {
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const pagerContext = usePagerHeaderContext()

  return <View style={style}>{children}</View>
}

function GrowableAvatarInner({
  scrollY,
  children,
  style,
}: {
  scrollY: SharedValue<number>
  children: React.ReactNode
  style?: StyleProp<ViewStyle>
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(scrollY.get(), [-150, 0], [1.2, 1], {
          extrapolateRight: Extrapolation.CLAMP,
        }),
      },
    ],
  }))

  return (
    <Animated.View
      style={[style, {transformOrigin: 'bottom left'}, animatedStyle]}>
      {children}
    </Animated.View>
  )
}
