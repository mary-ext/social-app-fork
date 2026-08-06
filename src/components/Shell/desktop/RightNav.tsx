import { useLayoutBreakpoints } from '#/lib/hooks/use-breakpoints';

import { useSession } from '#/state/session';

import { AppLanguageDropdown } from '#/components/AppLanguageDropdown';
import { DesktopFeeds } from '#/components/Shell/desktop/Feeds';
import { DesktopSearch } from '#/components/Shell/desktop/Search';
import { SidebarTrendingTopics } from '#/components/Shell/desktop/SidebarTrendingTopics';
import { ExternalInlineLinkText } from '#/components/web/Link';

import { SOURCE_CODE_URL } from '#/env';
import { m } from '#/paraglide/messages';

import * as css from './RightNav.css';

export function DesktopRightNav({ routeName }: { routeName: string }) {
	const { hasSession } = useSession();
	const isExploreScreen = routeName === 'Explore';
	// both the Explore landing and the Search results screen carry their own search input
	const isSearchScreen = isExploreScreen || routeName === 'Search';
	const { leftNavMinimal } = useLayoutBreakpoints();

	return (
		<div className={css.root}>
			{!isSearchScreen && <DesktopSearch />}

			{hasSession && <DesktopFeeds />}
			{/* the Explore landing already shows trending topics in its main column, so skip the sidebar duplicate */}
			{!isExploreScreen && <SidebarTrendingTopics />}

			<ExternalInlineLinkText
				href={SOURCE_CODE_URL}
				color="textContrastMedium"
				size="sm"
				label={m['common.sourceCode']()}
			>
				{m['common.sourceCode']()}
			</ExternalInlineLinkText>

			{!hasSession && leftNavMinimal && <AppLanguageDropdown />}
		</div>
	);
}
