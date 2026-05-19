import {Pressable} from 'react-native'

import Animated, {
  type AnimatedRef,
  type AnimatedView,
} from '#/lib/animations/reanimatedCompat'
import {atoms as a} from '#/alf'

export function GrowableBanner({
  backButton,
  children,
  onPress,
  bannerRef,
  testID,
  label,
}: {
  backButton?: React.ReactNode
  children: React.ReactNode
  onPress?: () => void
  bannerRef?: AnimatedRef<AnimatedView>
  testID?: string
  label?: string
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="image"
      accessibilityLabel={label}
      accessibilityHint=""
      style={[a.w_full, a.h_full]}>
      <Animated.View ref={bannerRef} style={[a.w_full, a.h_full]}>
        {children}
      </Animated.View>
      {backButton}
    </Pressable>
  )
}

// stayed true for at least `delay` ms before returning to false
