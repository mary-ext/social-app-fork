import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import type { AnyProfileView } from '@atcute/bluesky';

import { MagnifyingGlassIcon } from '#/lib/icons';
import { useFocusEffect, useRoute } from '#/lib/router';

import { focusSearch, softReset } from '#/state/events';
import { useSession } from '#/state/session';

import { makeSearchQuery, type Params, parseSearchQuery } from '#/screens/Search/utils';

import { SearchAutocomplete } from '#/components/SearchAutocomplete/SearchAutocomplete';
import { Text } from '#/components/Text';
import * as Layout from '#/components/web/Layout';
import { useNavigateToPath } from '#/components/web/Link';

import { m } from '#/paraglide/messages';
import { buildPath, useNavigate, useRouter, useSetParams } from '#/routes';
import { colors } from '#/styles/colors';

import { Explore } from './Explore';
import { SearchResults, type SearchTabId } from './SearchResults';
import * as css from './Shell.css';

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
	const router = useRouter();
	const navigate = useNavigate();
	const setParams = useSetParams();
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

	const navigateToQuery = (nextQuery: string) => {
		scrollToTopWeb();
		// dynamic route name (Search or ProfileSearch), so build the URL untyped.
		router.push(buildPath(route.name, { ...route.params, q: nextQuery }));
	};

	const navigateToProfile = (profile: AnyProfileView) => {
		navigate('Profile', { name: profile.did });
	};

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
		router.push(buildPath(route.name, parameters));
	}, [route.name, route.params, router]);

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

	const focusSearchInput = (tab?: TabParam) => {
		focusSearch.emit();

		// If a tab is specified, set the tab parameter so a subsequent search lands on it
		if (tab) {
			setParams({ tab });
		}
	};

	const navButtonNode =
		navButton === 'back' ? (
			<Layout.Header.BackButton />
		) : queryWithParams ? (
			<Layout.Header.BackButton
				label={m['screens.search.explore.back']()}
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
			{/* explore carries the header's bottom border; search results have their own tab-bar border below */}
			<Layout.Header.Outer noBottomBorder={!!queryWithParams} ref={headerRef}>
				{navButtonNode}

				<Layout.Header.Content>
					<SearchAutocomplete
						eager
						// trailing space so the caret opens on a fresh token, ready to append an operator/filter
						initialQuery={queryParam ? queryParam + ' ' : queryParam}
						placeholder={inputPlaceholder ?? m['screens.search.input.placeholder']()}
						onNavigate={(path) => navigateToPath(path, 'push')}
						onNavigateToProfile={navigateToProfile}
						onSubmit={navigateToQuery}
					/>
				</Layout.Header.Content>
			</Layout.Header.Outer>
			<div className={css.body}>
				<SearchScreenInner
					activeTab={activeTab}
					setActiveTab={setActiveTab}
					query={query}
					queryWithParams={queryWithParams}
					headerHeight={headerHeight}
					focusSearchInput={focusSearchInput}
				/>
			</div>
		</Layout.Screen>
	);
}

function SearchScreenInner({
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
}) {
	const { hasSession } = useSession();

	if (queryWithParams) {
		return (
			<SearchResults
				query={query}
				queryWithParams={queryWithParams}
				activeTab={activeTab}
				headerHeight={headerHeight}
				onTabChange={setActiveTab}
			/>
		);
	}

	if (hasSession) {
		return <Explore focusSearchInput={focusSearchInput} />;
	}

	return (
		<Layout.Content>
			<div className={css.heading}>
				<Text size="_2xl" weight="bold">
					{m['common.action.search']()}
				</Text>
			</div>

			<div className={css.empty}>
				<MagnifyingGlassIcon strokeWidth={3} size={60} color={colors.textContrastMedium} />
				<Text color="textContrastMedium" size="md">
					{m['screens.search.input.description']()}
				</Text>
			</div>
		</Layout.Content>
	);
}

function useQueryManager({ fixedParams, initialQuery }: { fixedParams?: Params; initialQuery: string }) {
	const { params, query } = parseSearchQuery(initialQuery || '');
	return {
		query,
		queryWithParams: makeSearchQuery(query, { ...params, ...fixedParams }),
	};
}

function scrollToTopWeb() {
	window.scrollTo(0, 0);
}
