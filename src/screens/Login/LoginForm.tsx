import {useCallback, useRef, useState} from 'react'
import {Keyboard, type TextInput, View} from 'react-native'
import {
  ComAtprotoServerCreateSession,
  type ComAtprotoServerDescribeServer,
} from '@atproto/api'
import {Trans, useLingui} from '@lingui/react/macro'

import {cleanError, isNetworkError} from '#/lib/strings/errors'
import {createFullHandle} from '#/lib/strings/handles'
import {logger} from '#/logger'
import {useSetHasCheckedForStarterPack} from '#/state/preferences/used-starter-packs'
import {useSessionApi} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {atoms as a, useTheme} from '#/alf'
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
import {FormError} from '#/components/forms/FormError'
import {HostingProvider} from '#/components/forms/HostingProvider'
import * as TextField from '#/components/forms/TextField'
import {At_Stroke2_Corner0_Rounded as At} from '#/components/icons/At'
import {Lock_Stroke2_Corner0_Rounded as Lock} from '#/components/icons/Lock'
import {Ticket_Stroke2_Corner0_Rounded as Ticket} from '#/components/icons/Ticket'
import {Loader} from '#/components/Loader'
import {Text} from '#/components/Typography'
import {FormContainer} from './FormContainer'

type ServiceDescription = ComAtprotoServerDescribeServer.OutputSchema

export const LoginForm = ({
  error,
  serviceUrl,
  serviceDescription,
  initialHandle,
  setError,
  setServiceUrl,
  onPressRetryConnect,
  onPressBack,
  onPressForgotPassword,
  onAttemptSuccess,
  onAttemptFailed,
}: {
  error: string
  serviceUrl: string
  serviceDescription: ServiceDescription | undefined
  initialHandle: string
  setError: (v: string) => void
  setServiceUrl: (v: string) => void
  onPressRetryConnect: () => void
  onPressBack: () => void
  onPressForgotPassword: () => void
  onAttemptSuccess: () => void
  onAttemptFailed: () => void
}) => {
  const t = useTheme()
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorField, setErrorField] = useState<
    'none' | 'identifier' | 'password' | '2fa'
  >('none')
  const [isAuthFactorTokenNeeded, setIsAuthFactorTokenNeeded] = useState(false)
  const identifierValueRef = useRef<string>(initialHandle || '')
  const passwordValueRef = useRef<string>('')
  const [authFactorToken, setAuthFactorToken] = useState('')
  const identifierRef = useRef<TextInput>(null)
  const passwordRef = useRef<TextInput>(null)
  const {t: l} = useLingui()
  const {login} = useSessionApi()
  const {setShowLoggedOut} = useLoggedOutViewControls()
  const setHasCheckedForStarterPack = useSetHasCheckedForStarterPack()

  const onPressSelectService = useCallback(() => {
    Keyboard.dismiss()
  }, [])

  const onPressNext = async () => {
    if (isProcessing) return
    Keyboard.dismiss()
    setError('')
    setErrorField('none')

    const identifier = identifierValueRef.current.toLowerCase().trim()
    const password = passwordValueRef.current

    if (!identifier) {
      setError(l`Please enter your username`)
      setErrorField('identifier')
      return
    }

    if (!password) {
      setError(l`Please enter your password`)
      setErrorField('password')
      return
    }

    setIsProcessing(true)

    try {
      // try to guess the handle if the user just gave their own username
      let fullIdent = identifier
      if (
        !identifier.includes('@') && // not an email
        !identifier.includes('.') && // not a domain
        serviceDescription &&
        serviceDescription.availableUserDomains.length > 0
      ) {
        let matched = false
        for (const domain of serviceDescription.availableUserDomains) {
          if (fullIdent.endsWith(domain)) {
            matched = true
          }
        }
        if (!matched) {
          fullIdent = createFullHandle(
            identifier,
            serviceDescription.availableUserDomains[0]!,
          )
        }
      }

      // TODO remove double login
      await login(
        {
          service: serviceUrl,
          identifier: fullIdent,
          password,
          authFactorToken: authFactorToken.trim(),
        },
        'LoginForm',
      )
      onAttemptSuccess()
      setShowLoggedOut(false)
      setHasCheckedForStarterPack(true)
    } catch (e: any) {
      const errMsg = e.toString()
      setIsProcessing(false)
      if (
        e instanceof ComAtprotoServerCreateSession.AuthFactorTokenRequiredError
      ) {
        setIsAuthFactorTokenNeeded(true)
      } else {
        onAttemptFailed()
        if (errMsg.includes('Token is invalid')) {
          logger.debug('Failed to login due to invalid 2fa token', {
            error: errMsg,
          })
          setError(l`Invalid 2FA confirmation code.`)
          setErrorField('2fa')
        } else if (
          errMsg.includes('Authentication Required') ||
          errMsg.includes('Invalid identifier or password')
        ) {
          logger.debug('Failed to login due to invalid credentials', {
            error: errMsg,
          })
          setError(l`Incorrect username or password`)
        } else if (isNetworkError(e)) {
          logger.warn('Failed to login due to network error', {error: errMsg})
          setError(
            l`Unable to contact your service. Please check your Internet connection.`,
          )
        } else {
          logger.warn('Failed to login', {error: errMsg})
          setError(cleanError(errMsg))
        }
      }
    }
  }

  return (
    <FormContainer testID="loginForm" titleText={<Trans>Sign in</Trans>}>
      <View>
        <TextField.LabelText>
          <Trans>Hosting provider</Trans>
        </TextField.LabelText>
        <HostingProvider
          serviceUrl={serviceUrl}
          onSelectServiceUrl={setServiceUrl}
          onOpenDialog={onPressSelectService}
        />
      </View>
      <View>
        <TextField.LabelText>
          <Trans>Account</Trans>
        </TextField.LabelText>
        <View style={[a.gap_sm]}>
          <TextField.Root isInvalid={errorField === 'identifier'}>
            <TextField.Icon icon={At} />
            <TextField.Input
              testID="loginUsernameInput"
              inputRef={identifierRef}
              label={l`Username or email address`}
              autoCapitalize="none"
              autoFocus={true}
              autoCorrect={false}
              autoComplete="username"
              returnKeyType="next"
              textContentType="username"
              defaultValue={initialHandle || ''}
              onChangeText={v => {
                identifierValueRef.current = v
                if (errorField) setErrorField('none')
              }}
              onSubmitEditing={() => {
                passwordRef.current?.focus()
              }}
              blurOnSubmit={false} // prevents flickering due to onSubmitEditing going to next field
              editable={!isProcessing}
              accessibilityHint={l`Enter the username or email address you used when you created your account`}
            />
          </TextField.Root>

          <TextField.Root isInvalid={errorField === 'password'}>
            <TextField.Icon icon={Lock} />
            <TextField.Input
              testID="loginPasswordInput"
              inputRef={passwordRef}
              label={l`Password`}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              returnKeyType="done"
              enablesReturnKeyAutomatically={true}
              secureTextEntry={true}
              clearButtonMode="while-editing"
              onChangeText={v => {
                passwordValueRef.current = v
                if (errorField) setErrorField('none')
              }}
              onSubmitEditing={onPressNext}
              blurOnSubmit={false} // HACK: https://github.com/facebook/react-native/issues/21911#issuecomment-558343069 Keyboard blur behavior is now handled in onSubmitEditing
              editable={!isProcessing}
              accessibilityHint={l`Enter your password`}
              onLayout={undefined as any}
            />
            <Button
              testID="forgotPasswordButton"
              onPress={onPressForgotPassword}
              label={l`Forgot password?`}
              accessibilityHint={l`Opens password reset form`}
              variant="solid"
              color="secondary"
              style={[
                a.rounded_sm,
                // t.atoms.bg_contrast_100,
                {marginLeft: 'auto', left: 6, padding: 6},
                a.z_10,
              ]}>
              <ButtonText>
                <Trans>Forgot?</Trans>
              </ButtonText>
            </Button>
          </TextField.Root>
        </View>
      </View>
      {isAuthFactorTokenNeeded && (
        <View>
          <TextField.LabelText>
            <Trans>2FA Confirmation</Trans>
          </TextField.LabelText>
          <TextField.Root isInvalid={errorField === '2fa'}>
            <TextField.Icon icon={Ticket} />
            <TextField.Input
              testID="loginAuthFactorTokenInput"
              label={l`Confirmation code`}
              autoCapitalize="none"
              autoFocus
              autoCorrect={false}
              autoComplete="one-time-code"
              returnKeyType="done"
              blurOnSubmit={false} // prevents flickering due to onSubmitEditing going to next field
              value={authFactorToken} // controlled input due to uncontrolled input not receiving pasted values properly
              onChangeText={text => {
                setAuthFactorToken(text)
                if (errorField) setErrorField('none')
              }}
              onSubmitEditing={onPressNext}
              editable={!isProcessing}
              accessibilityHint={l`Input the code which has been emailed to you`}
              style={{
                textTransform: authFactorToken === '' ? 'none' : 'uppercase',
              }}
            />
          </TextField.Root>
          <Text style={[a.text_sm, t.atoms.text_contrast_medium, a.mt_sm]}>
            <Trans>
              Check your email for a sign in code and enter it here.
            </Trans>
          </Text>
        </View>
      )}
      <FormError error={error} />
      <View style={[a.pt_md, [a.justify_between, a.flex_row] as any]}>
        {
          <Button
            label={l`Back`}
            color="secondary"
            size="large"
            onPress={onPressBack}>
            <ButtonText>
              <Trans>Back</Trans>
            </ButtonText>
          </Button>
        }
        {!serviceDescription && error ? (
          <Button
            testID="loginRetryButton"
            label={l`Retry`}
            accessibilityHint={l`Retries signing in`}
            color="primary_subtle"
            size="large"
            onPress={onPressRetryConnect}>
            <ButtonText>
              <Trans>Retry</Trans>
            </ButtonText>
          </Button>
        ) : !serviceDescription ? (
          <Button
            label={l`Connecting to service...`}
            size="large"
            color="secondary"
            disabled>
            <ButtonIcon icon={Loader} />
            <ButtonText>Connecting...</ButtonText>
          </Button>
        ) : (
          <Button
            testID="loginNextButton"
            label={l`Sign in`}
            accessibilityHint={l`Navigates to the next screen`}
            color="primary"
            size="large"
            onPress={onPressNext}>
            <ButtonText>
              <Trans>Sign in</Trans>
            </ButtonText>
            {isProcessing && <ButtonIcon icon={Loader} />}
          </Button>
        )}
      </View>
    </FormContainer>
  )
}
