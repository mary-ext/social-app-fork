import {useEffect, useState} from 'react'
import {View, type ViewStyle} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'
import {useNavigation} from '@react-navigation/native'

import {useKawaiiMode} from '#/state/preferences/kawaii'
import {useSession} from '#/state/session'
import {DesktopFeeds} from '#/view/shell/desktop/Feeds'
import {DesktopSearch} from '#/view/shell/desktop/Search'
import {SidebarTrendingTopics} from '#/view/shell/desktop/SidebarTrendingTopics'
import {atoms as a, useGutters, useLayoutBreakpoints, useTheme} from '#/alf'
import {AppLanguageDropdown} from '#/components/AppLanguageDropdown'
import {CENTER_COLUMN_OFFSET} from '#/components/Layout'
import {InlineLinkText} from '#/components/Link'
import {Text} from '#/components/Typography'
import {SOURCE_CODE_URL} from '#/env/common'

type WebViewStyle = Omit<ViewStyle, 'maxHeight' | 'position' | 'transform'> & {
  maxHeight?: string
  position?: 'fixed'
  transform?: (
    | NonNullable<ViewStyle['transform']>[number]
    | {translateX: number | string}
  )[]
}

const webViewStyle = (style: WebViewStyle): ViewStyle => {
  return style as unknown as ViewStyle
}

function useWebQueryParams() {
  const navigation = useNavigation()
  const [params, setParams] = useState<Record<string, string>>({})

  useEffect(() => {
    return navigation.addListener('state', e => {
      try {
        const {state} = e.data
        const lastRoute = state.routes[state.routes.length - 1]!
        setParams(lastRoute.params)
      } catch (err) {}
    })
  }, [navigation, setParams])

  return params
}

export function DesktopRightNav({routeName}: {routeName: string}) {
  const t = useTheme()
  const {t: l} = useLingui()
  const {hasSession} = useSession()
  const kawaii = useKawaiiMode()
  const gutters = useGutters(['base', 0, 'base', 'wide'])
  const isSearchScreen = routeName === 'Search'
  const isMessagesRelatedScreen = routeName.startsWith('Messages')
  const webqueryParams = useWebQueryParams()
  const searchQuery = webqueryParams?.q
  const showExploreScreenDuplicatedContent =
    !isSearchScreen || (isSearchScreen && !!searchQuery)
  const {rightNavVisible, centerColumnOffset, leftNavMinimal} =
    useLayoutBreakpoints()

  if (!rightNavVisible || isMessagesRelatedScreen) {
    return null
  }

  const width = centerColumnOffset ? 250 : 300

  return (
    <View
      style={[
        gutters,
        a.gap_lg,
        a.pr_2xs,
        webViewStyle({
          position: 'fixed',
          left: '50%',
          transform: [
            {
              translateX: 300 + (centerColumnOffset ? CENTER_COLUMN_OFFSET : 0),
            },
            ...a.scrollbar_offset.transform,
          ],
          /**
           * Compensate for the right padding above (2px) to retain intended width.
          */
          width: width + gutters.paddingLeft + 2,
          maxHeight: '100vh',
        }),
      ]}>
      {!isSearchScreen && <DesktopSearch />}
      {hasSession && (
        <>
          <DesktopFeeds />
        </>
      )}
      {showExploreScreenDuplicatedContent && <SidebarTrendingTopics />}
      <Text style={[a.leading_snug, t.atoms.text_contrast_low]}>
        <InlineLinkText
          to={SOURCE_CODE_URL}
          style={[t.atoms.text_contrast_medium]}
          label={l`Source code`}>
          {l`Source code`}
        </InlineLinkText>
      </Text>
      {kawaii && (
        <Text style={[t.atoms.text_contrast_medium, {marginTop: 12}]}>
          <Trans>
            Logo by{' '}
            <InlineLinkText
              label={l`Logo by @sawaratsuki.bsky.social`}
              to="/profile/sawaratsuki.bsky.social">
              @sawaratsuki.bsky.social
            </InlineLinkText>
          </Trans>
        </Text>
      )}
      {!hasSession && leftNavMinimal && (
        <View style={[a.w_full, {height: 32}]}>
          <AppLanguageDropdown />
        </View>
      )}
    </View>
  )
}
