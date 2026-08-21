import { useIsWithinSplitView } from '#/screens/Messages/components/splitView/context';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import * as layoutStyles from '#/components/web/Layout/Layout.css';

import { m } from '#/paraglide/messages';

export function RouteLoadingScreen() {
	const { isWithinSplitView } = useIsWithinSplitView();

	// avoid Layout.Screen's profile dependency in the initial chunk.
	return (
		<div className={layoutStyles.screen({ withinSplitView: isWithinSplitView })}>
			<CenteredSpinner label={m['common.status.loading']()} size="_2xl" fill />
		</div>
	);
}
