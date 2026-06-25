import { memo, useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import type { AnyProfileView } from '@atcute/bluesky';
import { Trans, useLingui } from '@lingui/react/macro';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';

import { MagnifyingGlassIcon } from '#/lib/icons';
import type { NavigationProp } from '#/lib/routes/types';

import { focusSearch, softReset } from '#/state/events';
import { useSession } from '#/state/session';

import { makeSearchQuery, type Params, parseSearchQuery } from '#/screens/Search/utils';

import { atoms as a, useBreakpoints, useTheme } from '#/alf';

import { Text } from '#/components/Typography';
import * as Layout from '#/components/web/Layout';
import { useNavigateToPath } from '#/components/web/Link';
import { SearchAutocomplete } from '#/components/web/SearchAutocomplete/SearchAutocomplete';

import { colors } from '#/styles/colors';

import { Explore } from './Explore';
import { SearchResults, type SearchTabId } from './SearchResults';

type TabParam = 'feed' | 'latest' | 'profile' | 'user';

// Map tab parameter to tab id
function getTabId(tabParam?: TabParam): SearchTabId {
	switch (tabParam) {
		case 'feed':
			return 'feeds';
		case 'latest':
			return 'latest';
		case 'profile':
		case 'user':
			return 'people';
		default:
			return 'top';
	}
}

export function SearchScreenShell({
	queryParam,
	fixedParams,
	navButton = 'menu',
	inputPlaceholder,
}: {
	queryParam: string;
	fixedParams?: Params;
	navButton?: 'back' | 'menu';
	inputPlaceholder?: string;
}) {
	const { t: l } = useLingui();
	const navigation = useNavigation<NavigationProp>();
	const route = useRoute();
	const navigateToPath = useNavigateToPath();

	// Get tab parameter from route params
	const tabParam = (route.params as { q?: string; tab?: TabParam })?.tab;
	const [activeTab, setActiveTab] = useState(() => getTabId(tabParam));

	const { query, queryWithParams } = useQueryManager({ fixedParams, initialQuery: queryParam });

	// measure the sticky header so the tab bar below it can offset itself by that height
	const [headerHeight, setHeaderHeight] = useState(0);
	const headerRef = useRef<HTMLDivElement | null>(null);
	useLayoutEffect(() => {
		const el = headerRef.current;
		if (!el) return;
		const measure = () => setHeaderHeight(el.getBoundingClientRect().height);
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	const navigateToQuery = useCallback(
		(nextQuery: string) => {
			scrollToTopWeb();
			// @ts-expect-error route params are not typesafe
			navigation.push(route.name, { ...route.params, q: nextQuery });
		},
		[navigation, route.name, route.params],
	);

	const navigateToProfile = useCallback(
		(profile: AnyProfileView) => {
			navigation.navigate('Profile', { name: profile.did });
		},
		[navigation],
	);

	const navigateToExplore = useCallback(() => {
		// drop back to the explore page: clear the query and tab, keeping any other route params (e.g. a profile
		// name on the profile-search variant)
		const {
			q: _q,
			tab: _tab,
			...parameters
		} = (route.params ?? {}) as {
			[key: string]: string;
		};
		// @ts-expect-error route params are not typesafe
		navigation.push(route.name, parameters);
	}, [navigation, route.name, route.params]);

	const onSoftReset = useCallback(() => {
		if (queryWithParams) {
			// viewing search results — drop back to the explore page
			navigateToExplore();
		} else {
			// already on the explore page — focus the search field
			focusSearch.emit();
		}
	}, [navigateToExplore, queryWithParams]);

	useFocusEffect(
		useCallback(() => {
			return softReset.subscribe(onSoftReset);
		}, [onSoftReset]),
	);

	const focusSearchInput = useCallback(
		(tab?: TabParam) => {
			focusSearch.emit();

			// If a tab is specified, set the tab parameter so a subsequent search lands on it
			if (tab) {
				navigation.setParams({ ...route.params, tab });
			}
		},
		[navigation, route.params],
	);

	const navButtonNode =
		navButton === 'back' ? (
			<Layout.Header.BackButton />
		) : queryWithParams ? (
			<Layout.Header.BackButton
				label={l`Back to Explore`}
				onClick={(evt) => {
					evt.preventDefault();
					navigateToExplore();
				}}
			/>
		) : (
			<Layout.Header.MenuButton />
		);

	return (
		<Layout.Screen>
			<Layout.Header.Outer noBottomBorder ref={headerRef}>
				{navButtonNode}
				<Layout.Header.Content>
					<SearchAutocomplete
						eager
						// trailing space so the caret opens on a fresh token, ready to append an operator/filter
						initialQuery={queryParam ? queryParam + ' ' : queryParam}
						placeholder={inputPlaceholder ?? l`Search for posts, users, or feeds`}
						onNavigate={(path) => navigateToPath(path, 'push')}
						onNavigateToProfile={navigateToProfile}
						onSubmit={navigateToQuery}
					/>
				</Layout.Header.Content>
			</Layout.Header.Outer>
			<View style={a.flex_1}>
				<SearchScreenInner
					activeTab={activeTab}
					setActiveTab={setActiveTab}
					query={query}
					queryWithParams={queryWithParams}
					headerHeight={headerHeight}
					focusSearchInput={focusSearchInput}
				/>
			</View>
		</Layout.Screen>
	);
}

let SearchScreenInner = ({
	activeTab,
	setActiveTab,
	query,
	queryWithParams,
	headerHeight,
	focusSearchInput,
}: {
	activeTab: SearchTabId;
	setActiveTab: React.Dispatch<React.SetStateAction<SearchTabId>>;
	query: string;
	queryWithParams: string;
	headerHeight: number;
	focusSearchInput: (tab?: TabParam) => void;
}): React.ReactNode => {
	const t = useTheme();
	const { hasSession } = useSession();
	const { gtTablet } = useBreakpoints();

	return queryWithParams ? (
		<SearchResults
			query={query}
			queryWithParams={queryWithParams}
			activeTab={activeTab}
			headerHeight={headerHeight}
			onTabChange={setActiveTab}
		/>
	) : hasSession ? (
		<Explore focusSearchInput={focusSearchInput} />
	) : (
		<Layout.Content>
			{gtTablet && (
				<View style={[a.border_b, t.atoms.border_contrast_low, a.px_lg, a.pt_sm, a.pb_lg]}>
					<Text style={[a.text_2xl, a.font_bold]}>
						<Trans>Search</Trans>
					</Text>
				</View>
			)}

			<View style={[a.align_center, a.justify_center, a.py_4xl, a.gap_lg]}>
				<MagnifyingGlassIcon strokeWidth={3} size={60} color={colors.textContrastMedium} />
				<Text style={[t.atoms.text_contrast_medium, a.text_md]}>
					<Trans>Find posts, users, and feeds on Bluesky</Trans>
				</Text>
			</View>
		</Layout.Content>
	);
};
SearchScreenInner = memo(SearchScreenInner);

function useQueryManager({ fixedParams, initialQuery }: { fixedParams?: Params; initialQuery: string }) {
	return useMemo(() => {
		const { params, query } = parseSearchQuery(initialQuery || '');
		return {
			query,
			queryWithParams: makeSearchQuery(query, { ...params, ...fixedParams }),
		};
	}, [fixedParams, initialQuery]);
}

function scrollToTopWeb() {
	window.scrollTo(0, 0);
}
