import { memo, useCallback } from 'react';
import { View } from 'react-native';
import { useLingui } from '@lingui/react/macro';
import { Trans } from '@lingui/react/macro';

import { useCloseAllActiveElements } from '#/state/util';
import { Logo } from '#/view/icons/Logo';
import { atoms as a } from '#/alf';
import { AppLanguageDropdown } from '#/components/AppLanguageDropdown';
import { Button, ButtonText } from '#/components/Button';
import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import { Link } from '#/components/Link';
import { Text } from '#/components/Typography';

let NavSignInCard = ({}: {}): React.ReactNode => {
	const { t: l } = useLingui();
	const { signinDialogControl } = useGlobalDialogsControlContext();
	const closeAllActiveElements = useCloseAllActiveElements();

	const showSignIn = useCallback(() => {
		closeAllActiveElements();
		signinDialogControl.open({});
	}, [signinDialogControl, closeAllActiveElements]);

	return (
		<View style={[{ maxWidth: 245 }]}>
			<Link to="/" label="Bluesky - Home">
				<Logo width={32} />
			</Link>
			<View style={[a.pt_lg]}>
				<Text style={[a.text_3xl, a.font_bold, { lineHeight: a.text_3xl.fontSize }]}>
					<Trans>Join the conversation</Trans>
				</Text>
			</View>
			<View style={[a.flex_row, a.flex_wrap, a.gap_sm, a.pt_md]}>
				<Button onPress={showSignIn} label={l`Sign in`} size="small" variant="solid" color="primary">
					<ButtonText>
						<Trans>Sign in</Trans>
					</ButtonText>
				</Button>
			</View>
			<View style={[a.mt_md, a.w_full, { height: 32 }]}>
				<AppLanguageDropdown />
			</View>
		</View>
	);
};
NavSignInCard = memo(NavSignInCard);
export { NavSignInCard };
