import {forwardRef, useImperativeHandle} from 'react'
import {
  ScrollView,
  type ScrollViewProps,
  type StyleProp,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native'

import {type SharedValue} from '#/lib/animations/reanimatedCompat'

export type BottomSheetBackdropProps = {
  animatedIndex: SharedValue<number>
  style?: StyleProp<ViewStyle>
}

export type BottomSheetMethods = {
  close: () => void
  snapToIndex: (index: number) => void
}

type BottomSheetProps = ViewProps & {
  android_keyboardInputMode?: string
  backdropComponent?: React.ComponentType<BottomSheetBackdropProps>
  backgroundStyle?: StyleProp<ViewStyle>
  enablePanDownToClose?: boolean
  handleHeight?: number
  handleIndicatorStyle?: StyleProp<ViewStyle>
  handleStyle?: StyleProp<ViewStyle>
  index?: number
  keyboardBlurBehavior?: string
  onChange?: (index: number) => void
  snapPoints?: Array<number | string>
}

const BottomSheet = forwardRef<BottomSheetMethods, BottomSheetProps>(
  function BottomSheet(
    {
      android_keyboardInputMode,
      backdropComponent: Backdrop,
      backgroundStyle,
      enablePanDownToClose,
      handleHeight,
      handleIndicatorStyle,
      handleStyle,
      index,
      keyboardBlurBehavior,
      onChange,
      snapPoints,
      style,
      ...props
    },
    ref,
  ) {
    void android_keyboardInputMode
    void enablePanDownToClose
    void handleHeight
    void handleIndicatorStyle
    void handleStyle
    void index
    void keyboardBlurBehavior
    void onChange
    void snapPoints

    useImperativeHandle(
      ref,
      () => ({
        close: () => {},
        snapToIndex: () => {},
      }),
      [],
    )

    return (
      <View style={[styles.hidden, backgroundStyle, style]} {...props}>
        {Backdrop ? undefined : null}
        {props.children}
      </View>
    )
  },
)

export function BottomSheetScrollView(props: ScrollViewProps) {
  return <ScrollView {...props} />
}

export function BottomSheetTextInput(props: TextInputProps) {
  return <TextInput {...props} />
}

const styles = StyleSheet.create({
  hidden: {
    display: 'none',
  },
})

export default BottomSheet
