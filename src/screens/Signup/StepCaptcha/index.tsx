import {useCallback, useEffect, useMemo, useState} from 'react'
import { ActivityIndicator, View } from 'react-native';
import ReactNativeDeviceAttest from 'react-native-device-attest'
import {useLingui} from '@lingui/react/macro'
import {nanoid} from 'nanoid/non-secure'

import {createFullHandle} from '#/lib/strings/handles'
import {logger} from '#/logger'
import {useSignupContext} from '#/screens/Signup/state'
import {CaptchaWebView} from '#/screens/Signup/StepCaptcha/CaptchaWebView'
import {atoms as a, useTheme} from '#/alf'
import {FormError} from '#/components/forms/FormError'
import { GCP_PROJECT_ID } from '#/env';
import {BackNextButtons} from '../BackNextButtons'

const CAPTCHA_PATH =
  '/gate/signup'

export function StepCaptcha() {
  return <StepCaptchaInner />
}

export function StepCaptchaNative() {
  const [token, setToken] = useState<string>()
  const [payload, setPayload] = useState<string>()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    void (async () => {
      logger.debug('trying to generate attestation token...')
      try {
        const {token, payload} =
          await ReactNativeDeviceAttest.getIntegrityToken('signup')
        setToken(token)
        setPayload(base64UrlEncode(payload))
      } catch (err) {
        const e = err as Error
        logger.error(e)
      } finally {
        setReady(true)
      }
    })()
  }, [])

  if (!ready) {
    return <View />
  }

  return <StepCaptchaInner token={token} payload={payload} />
}

function StepCaptchaInner({
  token,
  payload,
}: {
  token?: string
  payload?: string
}) {
  const {t: l} = useLingui()
  const theme = useTheme()
  const {state, dispatch} = useSignupContext()

  const [completed, setCompleted] = useState(false)

  const stateParam = useMemo(() => nanoid(15), [])
  const url = useMemo(() => {
    const newUrl = new URL(state.serviceUrl)
    newUrl.pathname = CAPTCHA_PATH
    newUrl.searchParams.set(
      'handle',
      createFullHandle(state.handle, state.userDomain),
    )
    newUrl.searchParams.set('state', stateParam)
    newUrl.searchParams.set('colorScheme', theme.name)

    return newUrl.href
  }, [
    state.serviceUrl,
    state.handle,
    state.userDomain,
    stateParam,
    theme.name,
    token,
    payload,
  ])

  const onSuccess = useCallback(
    (code: string) => {
      setCompleted(true)
      dispatch({
        type: 'submit',
        task: {verificationCode: code, mutableProcessed: false},
      })
    },
    [dispatch],
  )

  const onError = useCallback(
    (error?: unknown) => {
      dispatch({
        type: 'setError',
        value: l`Error receiving captcha response.`,
      })
      logger.error('Signup Flow Error', {
        registrationHandle: state.handle,
        error,
      })
    },
    [l, dispatch, state.handle],
  )

  const onBackPress = useCallback(() => {
    logger.error('Signup Flow Error', {
      errorMessage:
        'User went back from captcha step. Possibly encountered an error.',
      registrationHandle: state.handle,
    })

    dispatch({type: 'prev'})
  }, [dispatch, state.handle])

  return (
    <>
      <View style={[a.gap_lg, a.pt_lg]}>
        <View
          style={[
            a.w_full,
            a.overflow_hidden,
            {minHeight: 510},
            completed && [a.align_center, a.justify_center],
          ]}>
          {!completed ? (
            <CaptchaWebView
              url={url}
              stateParam={stateParam}
              state={state}
              onComplete={() => setCompleted(true)}
              onSuccess={onSuccess}
              onError={onError}
            />
          ) : (
            <ActivityIndicator size="large" />
          )}
        </View>
        <FormError error={state.error} />
      </View>
      <BackNextButtons
        hideNext
        isLoading={state.isLoading}
        onBackPress={onBackPress}
      />
    </>
  )
}

function base64UrlEncode(data: string): string {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(data)

  const binaryString = String.fromCharCode(...bytes)
  const base64 = btoa(binaryString)

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/[=]/g, '');
}
