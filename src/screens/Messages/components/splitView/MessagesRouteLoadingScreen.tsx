import { RouteLoadingScreen } from '#/view/shell/route-loading-screen';

import { useLayoutBreakpoints } from '#/alf';

import { CenteredSpinner } from '#/components/CenteredSpinner';

import { m } from '#/paraglide/messages';

import * as css from './MessagesSplitViewLayout.css';

/** route fallback shown before the messages split-view layout has loaded. */
export function MessagesRouteLoadingScreen() {
	const { rightNavVisible } = useLayoutBreakpoints();

	if (!rightNavVisible) {
		return <RouteLoadingScreen />;
	}

	return <MessagesSplitViewRouteLoadingScreen />;
}

/** loading placeholder for the active messages content column. */
export function MessagesSplitViewColumnLoadingScreen() {
	const { rightNavVisible } = useLayoutBreakpoints();

	if (!rightNavVisible) {
		return <RouteLoadingScreen />;
	}

	return <CenteredSpinner fill label={m['common.status.loading']()} size="2xl" />;
}

function MessagesSplitViewRouteLoadingScreen() {
	return (
		<div className={css.container}>
			<div className={css.leftColumn} />
			<div className={css.centerColumn}>
				<MessagesSplitViewColumnLoadingScreen />
			</div>
		</div>
	);
}
