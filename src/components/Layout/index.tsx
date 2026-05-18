import {forwardRef, memo, useContext, useMemo} from 'react'
import {
  type StyleProp,
  View,
  type ViewProps,
  type ViewStyle,
} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'

import Animated, {
  type AnimatedScrollView,
  type AnimatedScrollViewProps,
  useAnimatedStyle,
} from '#/lib/animations/reanimatedCompat'
import {useEnableMinimalShellModeForScreen} from '#/state/shell'
import {useShellLayout} from '#/state/shell/shell-layout'
import {useIsWithinSplitView} from '#/screens/Messages/components/splitView/context'
import { atoms as a, useBreakpoints, useLayoutBreakpoints, useTheme } from '#/alf';
import {useDialogContext} from '#/components/Dialog'
import {CENTER_COLUMN_OFFSET, SCROLLBAR_OFFSET} from '#/components/Layout/const'
import {ScrollbarOffsetContext} from '#/components/Layout/context'

export * from '#/components/Layout/const'
export * as Header from '#/components/Layout/Header'

export type ScreenProps = React.ComponentProps<typeof View> & {
  style?: StyleProp<ViewStyle>
  noInsetTop?: boolean
  minimalShell?: boolean
}

/**
 * Outermost component of every screen
 */
export const Screen = memo(function Screen({
  style,
  noInsetTop,
  minimalShell = false,
  ...props
}: ScreenProps) {
  const {top} = useSafeAreaInsets()
  const {isWithinSplitView} = useIsWithinSplitView()

  useEnableMinimalShellModeForScreen({enabled: minimalShell})

  return (
    <>
      {!isWithinSplitView && <WebCenterBorders />}
      <View
        style={[
          a.util_screen_outer,
          {paddingTop: noInsetTop ? 0 : top},
          isWithinSplitView && {maxHeight: '100%'},
          style,
        ]}
        {...props}
      />
    </>
  );
})

export type ContentProps = AnimatedScrollViewProps & {
  style?: StyleProp<ViewStyle>
  contentContainerStyle?: StyleProp<ViewStyle>
  ignoreTabletLayoutOffset?: boolean
}

/**
 * Default scroll view for simple pages
 */
export const Content = memo(
  forwardRef<AnimatedScrollView, ContentProps>(function Content(
    {
      children,
      style,
      contentContainerStyle,
      ignoreTabletLayoutOffset,
      ...props
    },
    ref,
  ) {
    const t = useTheme()
    const {footerHeight} = useShellLayout()
    const {isWithinSplitView} = useIsWithinSplitView()

    // note - if we ever make the footer transparent in any way,
    // we'll need to change this to use contentInsets/scrollIndicatorInsets
    // on iOS and contentContainerStyle padding on Android -sfn
    const animatedStyle = useAnimatedStyle(() => {
      return {
        marginBottom: footerHeight.get(),
      }
    })

    return (
      <Animated.ScrollView
        ref={ref}
        id="content"
        automaticallyAdjustsScrollIndicatorInsets={false}
        indicatorStyle={t.scheme === 'dark' ? 'white' : 'black'}
        style={[
          a.w_full,
          animatedStyle,
          isWithinSplitView &&
            {
              flex: 1,
              overflowY: 'scroll',
              scrollbarWidth: 'thin',
              scrollbarColor: `${t.palette.contrast_100} transparent`,
            } as any,
          style,
        ]}
        contentContainerStyle={[contentContainerStyle]}
        {...props}>
        {(<Center ignoreTabletLayoutOffset={ignoreTabletLayoutOffset}>
          {children}
        </Center>)}
      </Animated.ScrollView>
    );
  }),
)

/**
 * Utility component to center content within the screen
 */
export const Center = memo(function LayoutCenter({
  children,
  style,
  ignoreTabletLayoutOffset,
  ...props
}: ViewProps & {ignoreTabletLayoutOffset?: boolean}) {
  const {isWithinOffsetView} = useContext(ScrollbarOffsetContext)
  const {gtMobile} = useBreakpoints()
  const {centerColumnOffset} = useLayoutBreakpoints()
  const {isWithinDialog} = useDialogContext()
  const {isWithinSplitView} = useIsWithinSplitView()
  const ctx = useMemo(() => ({isWithinOffsetView: true}), [])
  return (
    <View
      style={[
        a.w_full,
        !isWithinSplitView && a.mx_auto,
        gtMobile && {
          maxWidth: 600,
        },
        !isWithinOffsetView &&
          !isWithinSplitView && {
            transform: [
              {
                translateX:
                  centerColumnOffset &&
                  !ignoreTabletLayoutOffset &&
                  !isWithinDialog
                    ? CENTER_COLUMN_OFFSET
                    : 0,
              },
              {translateX: SCROLLBAR_OFFSET ?? 0},
            ],
          },
        style,
      ]}
      {...props}>
      <ScrollbarOffsetContext.Provider value={ctx}>
        {children}
      </ScrollbarOffsetContext.Provider>
    </View>
  );
})

/**
 * Only used within `Layout.Screen`, not for reuse
 */
const WebCenterBorders = memo(function LayoutWebCenterBorders() {
  const t = useTheme()
  const {gtMobile} = useBreakpoints()
  const {centerColumnOffset} = useLayoutBreakpoints()
  return gtMobile ? (
    <View
      style={[
        a.fixed,
        a.inset_0,
        a.border_l,
        a.border_r,
        t.atoms.border_contrast_low,
        {
          width: 602,
          left: '50%',
          transform: [
            {translateX: '-50%'},
            {translateX: centerColumnOffset ? CENTER_COLUMN_OFFSET : 0},
            ...a.scrollbar_offset.transform,
          ],
        } as any,
      ]}
    />
  ) : null;
})
