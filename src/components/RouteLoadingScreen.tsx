import { CenteredSpinner } from '#/components/CenteredSpinner';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';

export function RouteLoadingScreen() {
	return (
		<Layout.Screen>
			<CenteredSpinner label={m['common.status.loading']()} size="_2xl" fill />
		</Layout.Screen>
	);
}
