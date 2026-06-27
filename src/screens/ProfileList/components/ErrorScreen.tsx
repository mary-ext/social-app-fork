import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import type { NavigationProp } from '#/lib/routes/types';

import { atoms as a, useTheme } from '#/alf';

import { Button, ButtonText } from '#/components/Button';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

export function ErrorScreen({ error }: { error: React.ReactNode }) {
	const t = useTheme();
	const navigation = useNavigation<NavigationProp>();
	const onPressBack = () => {
		if (navigation.canGoBack()) {
			navigation.goBack();
		} else {
			navigation.navigate('Home');
		}
	};

	return (
		<View style={[a.px_xl, a.py_md, a.gap_md]}>
			<Text style={[a.text_4xl, a.font_bold]}>{m['screens.profileList.error.loadFailed']()}</Text>
			<Text style={[a.text_md, t.atoms.text_contrast_high, a.leading_snug]}>{error}</Text>
			<View style={[a.flex_row, a.mt_lg]}>
				<Button
					label={m['common.action.goBack']()}
					accessibilityHint={m['common.a11y.goBack']()}
					onPress={onPressBack}
					size="small"
					color="secondary"
				>
					<ButtonText>{m['common.action.goBack']()}</ButtonText>
				</Button>
			</View>
		</View>
	);
}
