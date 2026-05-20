import { View } from 'react-native';

import { atoms as a } from '#/alf';

import * as Layout from '#/components/Layout';
import { Loader } from '#/components/Loader';

export function RouteLoadingScreen() {
	return (
		<Layout.Screen testID="routeLoadingScreen">
			<View style={[a.flex_1, a.align_center, a.justify_center, a.p_lg]}>
				<Loader size="xl" />
			</View>
		</Layout.Screen>
	);
}
