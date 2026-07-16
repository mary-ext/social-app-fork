import { useRoute } from '#/lib/router';

import { useSession } from '#/state/session';

import { DesktopFeeds } from '#/view/shell/desktop/Feeds';
import { DesktopSearch } from '#/view/shell/desktop/Search';
import { SidebarTrendingTopics } from '#/view/shell/desktop/SidebarTrendingTopics';

import { useLayoutBreakpoints } from '#/alf';

import { AppLanguageDropdown } from '#/components/AppLanguageDropdown';
import { ExternalInlineLinkText } from '#/components/web/Link';

import { SOURCE_CODE_URL } from '#/env/common';
import { m } from '#/paraglide/messages';

import * as css from './RightNav.css';

export function DesktopRightNav({ routeName }: { routeName: string }) {
	const { hasSession } = useSession();
	const isSearchScreen = routeName === 'Search';
	// read the search query off the route so a direct load reflects it, not only after a later navigation.
	const match = useRoute();
	const searchQuery = match.name === 'Search' ? (match.params.q as string | undefined) : undefined;
	const showExploreScreenDuplicatedContent = !isSearchScreen || (isSearchScreen && !!searchQuery);
	const { leftNavMinimal } = useLayoutBreakpoints();

	return (
		<div className={css.root}>
			{!isSearchScreen && <DesktopSearch />}

			{hasSession && <DesktopFeeds />}
			{showExploreScreenDuplicatedContent && <SidebarTrendingTopics />}

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
