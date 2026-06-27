import { useCallback } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import type { NavigationProp } from '#/lib/routes/types';

import { atoms as a, useTheme } from '#/alf';

import { Button, ButtonText } from '#/components/Button';
import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

export function ErrorState({ error }: { error: string }) {
	const t = useTheme();
	const navigation = useNavigation<NavigationProp>();

	const onPressBack = useCallback(() => {
		if (navigation.canGoBack()) {
			navigation.goBack();
		} else {
			navigation.navigate('Home');
		}
	}, [navigation]);

	return (
		<View style={[a.px_xl]}>
			<CircleInfo width={48} fill={colors.textContrastLow} />
			<Text style={[a.text_xl, a.font_semi_bold, a.pb_md, a.pt_xl]}>
				{m['screens.profile.error.moderationServiceLoad']()}
			</Text>
			<Text style={[a.text_md, a.leading_normal, a.pb_md, t.atoms.text_contrast_medium]}>
				{m['screens.profile.error.moderationUnavailable']()}
			</Text>
			<View style={[a.relative, a.py_md, a.px_lg, a.rounded_md, a.mb_2xl, t.atoms.bg_contrast_25]}>
				<Text style={[a.text_md, a.leading_normal]}>{error}</Text>
			</View>
			<View style={{ flexDirection: 'row' }}>
				<Button
					size="small"
					color="secondary"
					variant="solid"
					label={m['common.action.goBackTitle']()}
					accessibilityHint="Returns to previous page"
					onPress={onPressBack}
				>
					<ButtonText>{m['common.action.goBackTitle']()}</ButtonText>
				</Button>
			</View>
		</View>
	);
}
