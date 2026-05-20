import {View} from 'react-native'

import {RouteLoadingScreen} from '#/view/shell/route-loading-screen'
import {atoms as a, useLayoutBreakpoints, useTheme} from '#/alf'
import {SCROLLBAR_OFFSET} from '#/components/Layout/const'
import {Loader} from '#/components/Loader'
import {getMessagesSplitViewLayoutDimensions} from './layout-dimensions'

/**
 * renders the route fallback used before the messages split-view layout has loaded.
 *
 * @returns the messages-aware route loading placeholder
 */
export function MessagesRouteLoadingScreen() {
  const {rightNavVisible} = useLayoutBreakpoints()

  if (!rightNavVisible) {
    return <RouteLoadingScreen />
  }

  return <MessagesSplitViewRouteLoadingScreen />
}

/**
 * renders the loading placeholder for the active messages content column.
 *
 * @returns the column loading placeholder
 */
export function MessagesSplitViewColumnLoadingScreen() {
  const {rightNavVisible} = useLayoutBreakpoints()

  if (!rightNavVisible) {
    return <RouteLoadingScreen />
  }

  return (
    <View
      testID="messagesRouteColumnLoadingScreen"
      style={[a.flex_1, a.align_center, a.justify_center, a.p_lg]}>
      <Loader size="xl" />
    </View>
  )
}

function MessagesSplitViewRouteLoadingScreen() {
  const {centerColumnOffset} = useLayoutBreakpoints()
  const t = useTheme()
  const {centerColumnWidth, containerWidth, leftColumnWidth, offset} =
    getMessagesSplitViewLayoutDimensions({centerColumnOffset})

  return (
    <View
      testID="messagesRouteLoadingScreen"
      style={[
        a.flex_1,
        a.flex_row,
        a.mx_auto,
        {maxWidth: containerWidth},
        {
          transform: [
            {translateX: offset},
            {translateX: SCROLLBAR_OFFSET ?? 0},
          ],
        },
      ]}>
      <View
        style={[
          a.border_l,
          t.atoms.border_contrast_low,
          {width: leftColumnWidth},
        ]}
      />
      <View
        style={[
          a.border_x,
          t.atoms.border_contrast_low,
          {width: centerColumnWidth},
        ]}>
        <MessagesSplitViewColumnLoadingScreen />
      </View>
    </View>
  )
}
