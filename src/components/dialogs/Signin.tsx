import {useCallback, useEffect, useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'
import {useQueryClient} from '@tanstack/react-query'

import {DEFAULT_SERVICE} from '#/lib/constants'
import {logger} from '#/logger'
import {useServiceQuery} from '#/state/queries/service'
import {
  type SessionAccount,
  useSession,
  useSessionApi,
} from '#/state/session'
import {LoginForm} from '#/screens/Login/LoginForm'
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
import {AccountList} from '#/components/AccountList'
import * as Dialog from '#/components/Dialog'
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
import {Divider} from '#/components/Divider'
import * as Toast from '#/components/Toast'
import {Text} from '#/components/Typography'

export function SigninDialog() {
  const {signinDialogControl} = useGlobalDialogsControlContext()
  return (
    <Dialog.Outer
      control={signinDialogControl.control}
      onClose={signinDialogControl.clear}>
      <Dialog.Handle />
      <SigninDialogInner />
    </Dialog.Outer>
  )
}

function SigninDialogInner() {
  const t = useTheme()
  const {t: l} = useLingui()
  const {gtMobile} = useBreakpoints()
  const queryClient = useQueryClient()
  const {accounts, currentAccount} = useSession()
  const {resumeSession} = useSessionApi()
  const {signinDialogControl} = useGlobalDialogsControlContext()
  const payload = signinDialogControl.value
  const requestedAccount = payload?.requestedAccount
  const showStoredAccounts = payload?.showStoredAccounts ?? true
  const [pendingDid, setPendingDid] = useState<string | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<
    SessionAccount | undefined
  >(requestedAccount)
  const [error, setError] = useState('')
  const [serviceUrl, setServiceUrl] = useState(
    requestedAccount?.service || DEFAULT_SERVICE,
  )

  useEffect(() => {
    setSelectedAccount(requestedAccount)
    setServiceUrl(requestedAccount?.service || DEFAULT_SERVICE)
    setError('')
  }, [requestedAccount])

  const {
    data: serviceDescription,
    error: serviceError,
    refetch: refetchService,
  } = useServiceQuery(serviceUrl)

  useEffect(() => {
    if (serviceError) {
      setError(
        l`Unable to contact your service. Please check your Internet connection.`,
      )
      logger.warn(`Failed to fetch service description for ${serviceUrl}`, {
        error: String(serviceError),
      })
    } else {
      setError('')
    }
  }, [serviceError, serviceUrl, l])

  const onSelectAccount = useCallback(
    async (account: SessionAccount) => {
      if (pendingDid) {
        return
      }
      if (account.did === currentAccount?.did) {
        signinDialogControl.control.close()
        Toast.show(l`Already signed in as @${account.handle}`)
        return
      }
      if (!account.accessJwt) {
        setSelectedAccount(account)
        setServiceUrl(account.service)
        return
      }
      try {
        setPendingDid(account.did)
        history.pushState(null, '', '/')
        await resumeSession(account, true)
        signinDialogControl.control.close()
        await queryClient.resetQueries()
        Toast.show(l`Signed in as @${account.handle}`)
      } catch (e) {
        logger.error('sign in dialog: resume account failed', {
          message: e instanceof Error ? e.message : String(e),
        })
        setSelectedAccount(account)
        setServiceUrl(account.service)
      } finally {
        setPendingDid(null)
      }
    },
    [
      currentAccount?.did,
      l,
      pendingDid,
      queryClient,
      resumeSession,
      signinDialogControl.control,
    ],
  )

  const onAttemptSuccess = useCallback(() => {
    signinDialogControl.control.close()
  }, [signinDialogControl.control])

  const onPressRetryConnect = useCallback(() => {
    void refetchService()
  }, [refetchService])

  const onSelectStoredAccount = useCallback(
    (account: SessionAccount) => {
      void onSelectAccount(account)
    },
    [onSelectAccount],
  )

  return (
    <Dialog.ScrollableInner
      label={l`Sign in to Bluesky`}
      style={[gtMobile ? {width: 'auto', maxWidth: 560} : a.w_full]}>
      <View style={[a.gap_2xl]}>
        <View style={[a.gap_sm]}>
          <Text style={[a.font_semi_bold, a.text_2xl]}>
            <Trans>Sign in</Trans>
          </Text>
          <Text
            style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high]}>
            <Trans>Sign in to join the conversation.</Trans>
          </Text>
        </View>
        <LoginForm
          key={`${serviceUrl}:${selectedAccount?.did || 'new-account'}`}
          error={error}
          serviceUrl={serviceUrl}
          serviceDescription={serviceDescription}
          initialHandle={selectedAccount?.handle || ''}
          setError={setError}
          onAttemptFailed={() => {}}
          onAttemptSuccess={onAttemptSuccess}
          setServiceUrl={setServiceUrl}
          onPressRetryConnect={onPressRetryConnect}
        />
        {showStoredAccounts && accounts.length > 0 && (
          <View style={[a.gap_md]}>
            <Divider />
            <Text
              style={[
                a.text_sm,
                a.text_center,
                a.font_semi_bold,
                t.atoms.text_contrast_medium,
              ]}>
              <Trans>or sign in to an existing account</Trans>
            </Text>
            <AccountList
              onSelectAccount={onSelectStoredAccount}
              pendingDid={pendingDid}
            />
          </View>
        )}
      </View>
      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}
