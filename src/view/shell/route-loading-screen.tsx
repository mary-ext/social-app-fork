import { View } from 'react-native';

import { atoms as a } from '#/alf';

import * as Layout from '#/components/Layout';
import { Spinner } from '#/components/Spinner';

import { m } from '#/paraglide/messages';

export function RouteLoadingScreen() {
	return (
		<Layout.Screen testID="routeLoadingScreen">
			<View style={[a.flex_1, a.align_center, a.justify_center, a.p_lg]}>
				<Spinner color="default" label={m['common.status.loading']()} size="2xl" />
			</View>
		</Layout.Screen>
	);
}
