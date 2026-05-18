import {useCallback, useEffect} from 'react'
import {Alert} from 'react-native'

import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {parseLinkingUrl} from '#/lib/parseLinkingUrl'
import {useSession} from '#/state/session'
import {useCloseAllActiveElements} from '#/state/util'
import {Referrer} from '#/shims/bluesky-swiss-army'
import * as Linking from '#/shims/linking'
import * as WebBrowser from '#/shims/web-browser'
import {useApplyPullRequestOTAUpdate} from './useOTAUpdates'

type IntentType = 'compose' | 'apply-ota'

const VALID_IMAGE_REGEX = /^[\w.:\-_/]+\|\d+(\.\d+)?\|\d+(\.\d+)?$/

// This needs to stay outside of react to persist between account switches
let previousIntentUrl = ''

export function useIntentHandler() {
  const incomingUrl = Linking.useLinkingURL()
  const composeIntent = useComposeIntent()
  const {currentAccount} = useSession()
  const {tryApplyUpdate} = useApplyPullRequestOTAUpdate()

  useEffect(() => {
    const handleIncomingURL = async (url: string) => {
      const referrerInfo = Referrer.getReferrerInfo()
      if (referrerInfo && referrerInfo.hostname !== 'bsky.app') {
      }
      const urlp = parseLinkingUrl(url)
      const [, intent, intentType] = urlp.pathname.split('/')

      // On native, our links look like bluesky://intent/SomeIntent, so we have to check the hostname for the
      // intent check. On web, we have to check the first part of the path since we have an actual hostname
      const isIntent = intent === 'intent'
      const params = urlp.searchParams

      if (!isIntent) return

      switch (intentType as IntentType) {
        case 'compose': {
          composeIntent({
            text: params.get('text'),
            imageUrisStr: params.get('imageUris'),
            videoUri: params.get('videoUri'),
          })
          return
        }
        case 'apply-ota': {
          const channel = params.get('channel')
          if (!channel) {
            Alert.alert('Error', 'No channel provided to look for.')
          } else {
            tryApplyUpdate(channel)
          }
          return
        }
        default: {
          return
        }
      }
    }

    if (incomingUrl) {
      if (previousIntentUrl === incomingUrl) {
        return
      }
      handleIncomingURL(incomingUrl)
      previousIntentUrl = incomingUrl
    }
  }, [incomingUrl, composeIntent, currentAccount, tryApplyUpdate])
}

export function useComposeIntent() {
  const closeAllActiveElements = useCloseAllActiveElements()
  const {openComposer} = useOpenComposer()
  const {hasSession} = useSession()

  return useCallback(
    ({
      text,
      imageUrisStr,
      videoUri,
    }: {
      text: string | null
      imageUrisStr: string | null
      videoUri: string | null
    }) => {
      if (!hasSession) return
      closeAllActiveElements()

      // Whenever a video URI is present, we don't support adding images right now.
      if (videoUri) {
        const [uri, width, height] = videoUri.split('|')
        openComposer({
          text: text ?? undefined,
          videoUri: {uri, width: Number(width), height: Number(height)},
          logContext: 'Deeplink',
        })
        return
      }

      const imageUris = imageUrisStr
        ?.split(',')
        .filter(part => {
          // For some security, we're going to filter out any image uri that is external. We don't want someone to
          // be able to provide some link like "bluesky://intent/compose?imageUris=https://IHaveYourIpNow.com/image.jpeg
          // and we load that image
          if (part.includes('https://') || part.includes('http://')) {
            return false
          }
          // We also should just filter out cases that don't have all the info we need
          return VALID_IMAGE_REGEX.test(part)
        })
        .map(part => {
          const [uri, width, height] = part.split('|')
          return {uri, width: Number(width), height: Number(height)}
        })

      setTimeout(() => {
        openComposer({
          text: text ?? undefined,
          imageUris: undefined,
          logContext: 'Deeplink',
        })
      }, 500)
    },
    [hasSession, closeAllActiveElements, openComposer],
  );
}
