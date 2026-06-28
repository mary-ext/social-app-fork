import { useCallback } from 'react';
import { View } from 'react-native';
import { StackActions, useNavigation } from '@react-navigation/native';

import type { NavigationProp } from '#/lib/routes/types';

import { atoms as a, useTheme } from '#/alf';

import { Button, ButtonText } from '#/components/Button';
import * as Layout from '#/components/Layout';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

export const NotFoundScreen = () => {
	const t = useTheme();
	const navigation = useNavigation<NavigationProp>();

	const canGoBack = navigation.canGoBack();
	const onPressHome = useCallback(() => {
		if (canGoBack) {
			navigation.goBack();
		} else {
			navigation.navigate('HomeTab');
			navigation.dispatch(StackActions.popToTop());
		}
	}, [navigation, canGoBack]);

	return (
		<Layout.Screen testID="notFoundView">
			<Layout.Center>
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
			</Layout.Center>
		</Layout.Screen>
	);
};
