import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';

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

function useWebQueryParams() {
	const navigation = useNavigation();
	const [params, setParams] = useState<Record<string, string>>({});

	useEffect(() => {
		return navigation.addListener('state', (e) => {
			try {
				const { state } = e.data;
				const lastRoute = state.routes[state.routes.length - 1]!;
				setParams(lastRoute.params);
			} catch (err) {}
		});
	}, [navigation, setParams]);

	return params;
}

export function DesktopRightNav({ routeName }: { routeName: string }) {
	const { hasSession } = useSession();
	const isSearchScreen = routeName === 'Search';
	const webqueryParams = useWebQueryParams();
	const searchQuery = webqueryParams?.q;
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
