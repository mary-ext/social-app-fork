import {memo, useCallback} from 'react'
import {View} from 'react-native'
import {useLingui} from '@lingui/react/macro'
import {Trans} from '@lingui/react/macro'

import {useLoggedOutViewControls} from '#/state/shell/logged-out'
import {useCloseAllActiveElements} from '#/state/util'
import {Logo} from '#/view/icons/Logo'
import {atoms as a} from '#/alf'
import {Button, ButtonText} from '#/components/Button'
import {Link} from '#/components/Link'
import {Text} from '#/components/Typography'

let NavSignInCard = ({}: {}): React.ReactNode => {
  const {t: l} = useLingui()
  const {requestSwitchToAccount} = useLoggedOutViewControls()
  const closeAllActiveElements = useCloseAllActiveElements()

  const showSignIn = useCallback(() => {
    closeAllActiveElements()
    requestSwitchToAccount({requestedAccount: 'none'})
  }, [requestSwitchToAccount, closeAllActiveElements])

  return (
    <View style={[{maxWidth: 245}]}>
      <Link to="/" label="Bluesky - Home">
        <Logo width={32} />
      </Link>
      <View style={[a.pt_lg]}>
        <Text
          style={[a.text_3xl, a.font_bold, {lineHeight: a.text_3xl.fontSize}]}>
          <Trans>Sign in to continue</Trans>
        </Text>
      </View>
      <View style={[a.flex_row, a.flex_wrap, a.gap_sm, a.pt_md]}>
        <Button
          onPress={showSignIn}
          label={l`Sign in`}
          size="small"
          variant="solid"
          color="primary">
          <ButtonText>
            <Trans>Sign in</Trans>
          </ButtonText>
        </Button>
      </View>
    </View>
  )
}
NavSignInCard = memo(NavSignInCard)
export {NavSignInCard}
