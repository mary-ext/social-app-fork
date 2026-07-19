import { View } from 'react-native';

import { atoms as a, useTheme } from '#/alf';

import { Button, ButtonText } from '#/components/Button';
import * as Layout from '#/components/Layout';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';
import { useRouter } from '#/routes';

export const NotFoundScreen = () => {
	const t = useTheme();
	const router = useRouter();

	const canGoBack = router.canGoBack;
	const onPressHome = () => {
		if (canGoBack) {
			router.back();
		} else {
			router.popTo('Home');
		}
	};

	return (
		<Layout.Screen testID="notFoundView">
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content align="left">
					<Layout.Header.TitleText>{m['common.error.pageNotFound']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<View style={[a.px_xl, a.align_center, a.h_full, { paddingTop: 100 }]}>
				<Text style={[a.mb_md, a.text_4xl, a.font_semi_bold, t.atoms.text]}>
					{m['common.error.pageNotFound']()}
				</Text>
				<Text style={[a.mb_md, a.text_md, t.atoms.text]}>{m['common.error.notFoundDescription']()}</Text>
				<Button
					color="primary"
					size="small"
					label={canGoBack ? m['common.action.goBack']() : m['common.action.goHome']()}
					accessibilityLabel={canGoBack ? m['common.action.goBack']() : m['common.action.goHome']()}
					accessibilityHint={canGoBack ? m['common.a11y.goBack']() : m['common.a11y.goHome']()}
					onPress={onPressHome}
				>
					<ButtonText>{canGoBack ? m['common.action.goBack']() : m['common.action.goHome']()}</ButtonText>
				</Button>
			</View>
		</Layout.Screen>
	);
};
