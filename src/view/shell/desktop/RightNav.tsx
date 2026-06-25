import { useEffect, useState } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';

import { useSession } from '#/state/session';

import { DesktopFeeds } from '#/view/shell/desktop/Feeds';
import { DesktopSearch } from '#/view/shell/desktop/Search';
import { SidebarTrendingTopics } from '#/view/shell/desktop/SidebarTrendingTopics';

import { useLayoutBreakpoints } from '#/alf';

import { AppLanguageDropdown } from '#/components/AppLanguageDropdown';
import { Text } from '#/components/Text';
import { ExternalInlineLinkText, InlineLinkText } from '#/components/web/Link';

import { SOURCE_CODE_URL } from '#/env/common';
import { useKawaiiMode } from '#/storage/hooks/kawaii';

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
	const { t: l } = useLingui();
	const { hasSession } = useSession();
	const kawaii = useKawaiiMode();
	const isSearchScreen = routeName === 'Search';
	const isMessagesRelatedScreen = routeName.startsWith('Messages');
	const webqueryParams = useWebQueryParams();
	const searchQuery = webqueryParams?.q;
	const showExploreScreenDuplicatedContent = !isSearchScreen || (isSearchScreen && !!searchQuery);
	const { rightNavVisible, leftNavMinimal } = useLayoutBreakpoints();

	if (!rightNavVisible || isMessagesRelatedScreen) {
		return null;
	}

	return (
		<div className={css.root}>
			{!isSearchScreen && <DesktopSearch />}

			{hasSession && <DesktopFeeds />}
			{showExploreScreenDuplicatedContent && <SidebarTrendingTopics />}

			<ExternalInlineLinkText
				href={SOURCE_CODE_URL}
				color="textContrastMedium"
				size="sm"
				label={l`Source code`}
			>
				{l`Source code`}
			</ExternalInlineLinkText>

			{kawaii && (
				<Text color="textContrastMedium" size="sm">
					<Trans>
						Logo by{' '}
						<InlineLinkText
							size="sm"
							label={l`Logo by @sawaratsuki.bsky.social`}
							to="/profile/did:plc:du3w3sxieoct4kidddf6rpby"
						>
							@sawaratsuki.bsky.social
						</InlineLinkText>
					</Trans>
				</Text>
			)}

			{!hasSession && leftNavMinimal && <AppLanguageDropdown />}
		</div>
	);
}
