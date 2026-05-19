import {useCallback, useState} from 'react'
import {View} from 'react-native'
import {Trans, useLingui} from '@lingui/react/macro'

import {logger} from '#/logger'
import {type SessionAccount, useSession, useSessionApi} from '#/state/session'
import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {atoms as a} from '#/alf'
import {AccountList} from '#/components/AccountList'
import {Button, ButtonText} from '#/components/Button'
import * as TextField from '#/components/forms/TextField'
import * as Toast from '#/components/Toast'
import {FormContainer} from './FormContainer'

export const ChooseAccountForm = ({
  onSelectAccount,
  onPressBack,
}: {
  onSelectAccount: (account?: SessionAccount) => void
  onPressBack: () => void
}) => {
  const [pendingDid, setPendingDid] = useState<string | null>(null)
  const {t: l} = useLingui()
  const {currentAccount} = useSession()
  const {resumeSession} = useSessionApi()
  const {setShowLoggedOut} = useLoggedOutViewControls()

  const onSelect = useCallback(
    async (account: SessionAccount) => {
      if (pendingDid) {
        // The session API isn't resilient to race conditions so let's just ignore this.
        return
      }
      if (!account.accessJwt) {
        // Move to login form.
        onSelectAccount(account)
        return
      }
      if (account.did === currentAccount?.did) {
        setShowLoggedOut(false)
        Toast.show(l`Already signed in as @${account.handle}`)
        return
      }
      try {
        setPendingDid(account.did)
        await resumeSession(account, true)
        Toast.show(l`Signed in as @${account.handle}`)
      } catch (e) {
        logger.error('choose account: initSession failed', {
          message: e instanceof Error ? e.message : 'Unknown error',
        })
        // Move to login form.
        onSelectAccount(account)
      } finally {
        setPendingDid(null)
      }
    },
    [
      currentAccount,
      resumeSession,
      pendingDid,
      onSelectAccount,
      setShowLoggedOut,
      l,
    ],
  )

  return (
    <FormContainer
      testID="chooseAccountForm"
      titleText={<Trans>Select account</Trans>}
      style={[a.py_2xl]}>
      <View>
        {
          <TextField.LabelText>
            <Trans>Sign in as...</Trans>
          </TextField.LabelText>
        }
        <AccountList
          onSelectAccount={onSelect}
          onSelectOther={() => onSelectAccount()}
          pendingDid={pendingDid}
        />
      </View>
      {
        <View style={[a.flex_row]}>
          <Button
            label={l`Back`}
            color="secondary"
            size="large"
            onPress={onPressBack}>
            <ButtonText>{l`Back`}</ButtonText>
          </Button>
          <View style={[a.flex_1]} />
        </View>
      }
    </FormContainer>
  )
}
