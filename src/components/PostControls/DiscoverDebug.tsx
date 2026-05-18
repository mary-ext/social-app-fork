import {Pressable} from 'react-native'
import * as Clipboard from 'expo-clipboard'
import {t} from '@lingui/core/macro'

import {DISCOVER_DEBUG_DIDS} from '#/lib/constants'
import {useDebugFeedContextEnabled} from '#/state/preferences'
import {useSession} from '#/state/session'
import {atoms as a, useTheme} from '#/alf'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'
import {IS_INTERNAL} from '#/env'

export function DiscoverDebug({
  feedContext,
}: {
  feedContext: string | undefined
}) {
  const debugFeedContextEnabled = useDebugFeedContextEnabled()
  const {currentAccount} = useSession()
  const isDiscoverDebugUser =
    IS_INTERNAL ||
    DISCOVER_DEBUG_DIDS[currentAccount?.did || ''] ||
    debugFeedContextEnabled
  const theme = useTheme()

  return (
    isDiscoverDebugUser &&
    feedContext && (
      <Pressable
        accessible={false}
        hitSlop={10}
        style={[a.absolute, {zIndex: 1000, maxWidth: 65, bottom: -4}, a.left_0]}
        onPress={e => {
          e.stopPropagation()
          Clipboard.setStringAsync(feedContext)
          Toast.show(t`Copied to clipboard`)
        }}>
        <Text
          numberOfLines={1}
          style={{
            color: theme.palette.contrast_400,
            fontSize: 7,
          }}>
          {feedContext}
        </Text>
      </Pressable>
    )
  )
}
