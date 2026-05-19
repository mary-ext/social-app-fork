import {useCallback, useEffect, useState} from 'react'
import {View} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {useLingui} from '@lingui/react/macro'
import {useQueryClient} from '@tanstack/react-query'

import {STALE} from '#/state/queries'
import {profilesQueryKey} from '#/state/queries/profile'
import {useAgent, useSession} from '#/state/session'
import {
  useLoggedOutView,
  useLoggedOutViewControls,
} from '#/state/shell/logged-out'
import {useEnableMinimalShellMode} from '#/state/shell/minimal-mode'
import {ErrorBoundary} from '#/view/com/util/ErrorBoundary'
import {Login} from '#/screens/Login'
import {atoms as a, tokens, useTheme} from '#/alf'
import {Button, ButtonIcon} from '#/components/Button'
import {TimesLarge_Stroke2_Corner0_Rounded as XIcon} from '#/components/icons/Times'
import {SplashScreen} from './SplashScreen'

enum ScreenState {
  S_Welcome,
  S_Login,
}
export {ScreenState as LoggedOutScreenState}

export function LoggedOut({onDismiss}: {onDismiss?: () => void}) {
  const {t: l} = useLingui()
  const t = useTheme()
  const insets = useSafeAreaInsets()
  useEnableMinimalShellMode()
  const {requestedAccountSwitchTo} = useLoggedOutView()
  const [screenState, setScreenState] = useState<ScreenState>(() => {
    if (requestedAccountSwitchTo != null) {
      return ScreenState.S_Login
    } else {
      return ScreenState.S_Welcome
    }
  })
  const {clearRequestedAccount} = useLoggedOutViewControls()

  const queryClient = useQueryClient()
  const {accounts} = useSession()
  const agent = useAgent()
  useEffect(() => {
    const actors = accounts.map(acc => acc.did)
    if (actors.length === 0) return
    void queryClient.prefetchQuery({
      queryKey: profilesQueryKey(actors),
      staleTime: STALE.MINUTES.FIVE,
      queryFn: async () => {
        const res = await agent.getProfiles({actors})
        return res.data
      },
    })
  }, [accounts, agent, queryClient])

  const onPressDismiss = useCallback(() => {
    if (onDismiss) {
      onDismiss()
    }
    clearRequestedAccount()
  }, [clearRequestedAccount, onDismiss])

  return (
    <View
      testID="noSessionView"
      style={[
        a.util_screen_outer,
        t.atoms.bg,
        {paddingTop: insets.top, paddingBottom: insets.bottom},
      ]}>
      <ErrorBoundary>
        {onDismiss && screenState === ScreenState.S_Welcome ? (
          <Button
            label={l`Go back`}
            variant="solid"
            color="secondary_inverted"
            size="small"
            shape="round"
            PressableComponent={undefined as any}
            style={[
              a.absolute,
              {
                top: insets.top + tokens.space.xl,
                right: tokens.space.xl,
                zIndex: 100,
              },
            ]}
            onPress={onPressDismiss}>
            <ButtonIcon icon={XIcon} />
          </Button>
        ) : null}

        {screenState === ScreenState.S_Welcome ? (
          <SplashScreen
            onPressSignin={() => {
              setScreenState(ScreenState.S_Login)
            }}
          />
        ) : undefined}
        {screenState === ScreenState.S_Login ? (
          <Login
            onPressBack={() => {
              setScreenState(ScreenState.S_Welcome)
              clearRequestedAccount()
            }}
          />
        ) : undefined}
      </ErrorBoundary>
    </View>
  )
}
