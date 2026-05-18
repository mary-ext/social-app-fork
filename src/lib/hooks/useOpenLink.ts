import {useCallback} from 'react'
import {Linking} from 'react-native'

import {
  createBskyAppAbsoluteUrl,
  createProxiedUrl,
  isBskyAppUrl,
  isBskyRSSUrl,
  isRelativeUrl,
} from '#/lib/strings/url-helpers'
import {logger} from '#/logger'
import {useInAppBrowser} from '#/state/preferences/in-app-browser'
import {useTheme} from '#/alf'
import {useDialogContext} from '#/components/Dialog'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import * as WebBrowser from '#/shims/web-browser'

export function useOpenLink() {
  const enabled = useInAppBrowser()
  const t = useTheme()
  const dialogContext = useDialogContext()
  const {inAppBrowserConsentControl} = useGlobalDialogsControlContext()

  const openLink = useCallback(
    async (url: string, override?: boolean, shouldProxy?: boolean) => {
      if (isBskyRSSUrl(url) && isRelativeUrl(url)) {
        url = createBskyAppAbsoluteUrl(url)
      }

      if (!isBskyAppUrl(url)) {
        if (shouldProxy) {
          url = createProxiedUrl(url)
        }
      }

      Linking.openURL(url)
    },
    [enabled, inAppBrowserConsentControl, t, dialogContext],
  )

  return openLink
}
