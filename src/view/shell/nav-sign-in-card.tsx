import { memo, useCallback } from 'react';
import { View } from 'react-native';

import { Logo } from '#/view/icons/Logo';

import { atoms as a } from '#/alf';

import { AppLanguageDropdown } from '#/components/AppLanguageDropdown';
import { Button, ButtonText } from '#/components/Button';
import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import { Link } from '#/components/Link';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

let NavSignInCard = ({}: {}): React.ReactNode => {
	const { signinDialogControl } = useGlobalDialogsControlContext();

	const showSignIn = useCallback(() => {
		signinDialogControl.openWithPayload({});
	}, [signinDialogControl]);

	return (
		<View style={[{ maxWidth: 245 }]}>
			<Link to="/" label="Bluesky - Home">
				<Logo width={32} />
			</Link>
			<View style={[a.pt_lg]}>
				<Text style={[a.text_3xl, a.font_bold, { lineHeight: a.text_3xl.fontSize }]}>
					{m['view.cta.joinConversation']()}
				</Text>
			</View>
			<View style={[a.flex_row, a.flex_wrap, a.gap_sm, a.pt_md]}>
				<Button
					onPress={showSignIn}
					label={m['common.action.signIn']()}
					size="small"
					variant="solid"
					color="primary"
				>
					<ButtonText>{m['common.action.signIn']()}</ButtonText>
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
