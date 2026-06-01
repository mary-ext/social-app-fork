import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLingui, Trans } from '@lingui/react/macro';
import { StackActions, useNavigation } from '@react-navigation/native';

import { usePalette } from '#/lib/hooks/usePalette';
import type { NavigationProp } from '#/lib/routes/types';
import { s } from '#/lib/styles';

import { Button } from '#/view/com/util/forms/Button';
import { Text } from '#/view/com/util/text/Text';
import { ViewHeader } from '#/view/com/util/ViewHeader';

import * as Layout from '#/components/Layout';

export const NotFoundScreen = () => {
	const pal = usePalette('default');
	const { t: l } = useLingui();
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
			<ViewHeader title={l`Page Not Found`} />
			<View style={styles.container}>
				<Text type="title-2xl" style={[pal.text, s.mb10]}>
					<Trans>Page not found</Trans>
				</Text>
				<Text type="md" style={[pal.text, s.mb10]}>
					<Trans>We're sorry! We can't find the page you were looking for.</Trans>
				</Text>
				<Button
					type="primary"
					label={canGoBack ? l`Go Back` : l`Go Home`}
					accessibilityLabel={canGoBack ? l`Go back` : l`Go home`}
					accessibilityHint={canGoBack ? l`Returns to previous page` : l`Returns to home page`}
					onPress={onPressHome}
				/>
			</View>
		</Layout.Screen>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingTop: 100,
		paddingHorizontal: 20,
		alignItems: 'center',
		height: '100%',
	},
});
