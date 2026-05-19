import {useCallback} from 'react'
import {Pressable, View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from '#/lib/animations/reanimatedCompat'
import {
  ScaleAndFadeIn,
  ScaleAndFadeOut,
} from '#/lib/custom-animations/ScaleAndFade'
import {useHaptics} from '#/lib/haptics'
import {atoms as a, useTheme} from '#/alf'
import {ArrowBottom_Stroke2_Corner0_Rounded as ArrowDownIcon} from '#/components/icons/Arrow'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export function NewMessagesPill({
  onPress: onPressInner,
}: {
  onPress: () => void
}) {
  const t = useTheme()
  const playHaptic = useHaptics()
  const {bottom: bottomInset} = useSafeAreaInsets()

  const scale = useSharedValue(1)

  const onPressIn = useCallback(() => {
    return
  }, [scale])

  const onPressOut = useCallback(() => {
    return
  }, [scale])

  const onPress = useCallback(() => {
    runOnJS(playHaptic)()
    onPressInner?.()
  }, [onPressInner, playHaptic])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.get()}],
  }))

  return (
    <View
      style={[
        a.absolute,
        a.w_full,
        a.z_10,
        a.align_center,
        {
          bottom: bottomInset + 70,
          // Don't prevent scrolling in this area _except_ for in the pill itself
          pointerEvents: 'box-none',
        },
      ]}>
      <AnimatedPressable
        style={[
          a.align_center,
          a.justify_center,
          a.rounded_full,
          a.shadow_sm,
          a.border,
          t.atoms.bg,
          t.atoms.border_contrast_low,
          {
            height: 40,
            width: 40,
            alignItems: 'center',
            pointerEvents: 'box-only',
          },
          animatedStyle,
        ]}
        entering={ScaleAndFadeIn}
        exiting={ScaleAndFadeOut}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}>
        <ArrowDownIcon size="md" style={[t.atoms.text]} />
      </AnimatedPressable>
    </View>
  )
}
