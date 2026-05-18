import {useMemo} from 'react'
import {TouchableWithoutFeedback} from 'react-native'
import {type BottomSheetBackdropProps} from '@discord/bottom-sheet/src'
import {useLingui} from '@lingui/react/macro'

import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from '#/lib/animations/reanimatedCompat'

export function createCustomBackdrop(
  onClose?: () => void,
): React.FC<BottomSheetBackdropProps> {
  const CustomBackdrop = ({animatedIndex, style}: BottomSheetBackdropProps) => {
    const {t: l} = useLingui()

    // animated variables
    const opacity = useAnimatedStyle(() => ({
      opacity: interpolate(
        animatedIndex.get(), // current snap index
        [-1, 0], // input range
        [0, 0.5], // output range
        Extrapolation.CLAMP,
      ),
    }))

    const containerStyle = useMemo(
      () => [style, {backgroundColor: '#000'}, opacity],
      [style, opacity],
    )

    return (
      <TouchableWithoutFeedback
        onPress={onClose}
        accessibilityLabel={l`Close bottom drawer`}
        accessibilityHint=""
        onAccessibilityEscape={() => {
          if (onClose !== undefined) {
            onClose()
          }
        }}>
        <Animated.View style={containerStyle} />
      </TouchableWithoutFeedback>
    )
  }
  return CustomBackdrop
}
