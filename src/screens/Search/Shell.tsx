import { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { useFocusEffect } from '#/lib/router';

import { softReset } from '#/state/events';

import { SearchHeader } from '#/screens/Search/SearchHeader';
import { makeSearchQuery, parseSearchQuery, type TabParam } from '#/screens/Search/utils';

import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { useNavigate, useRoute } from '#/routes';

import { SearchResults, type SearchTabId } from './SearchResults';
import * as css from './Shell.css';

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

export function SearchScreenShell({ queryParam }: { queryParam: string }) {
	const navigate = useNavigate();
	const route = useRoute();

	// Get tab parameter from route params
	const tabParam = (route.params as { tab?: TabParam }).tab;
	const [activeTab, setActiveTab] = useState(() => getTabId(tabParam));

	const { params, query } = parseSearchQuery(queryParam || '');
	const queryWithParams = makeSearchQuery(query, params);

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

	const navigateToExplore = useCallback(() => {
		// drop back to the explore page: clear the query and tab
		navigate('Explore', {});
	}, [navigate]);

	useFocusEffect(
		useCallback(() => {
			return softReset.subscribe(navigateToExplore);
		}, [navigateToExplore]),
	);

	return (
		<Layout.Screen>
			{/* the tab bar below draws its own border, so the header goes borderless */}
			<SearchHeader
				headerRef={headerRef}
				initialQuery={queryParam}
				navButton={
					<Layout.Header.BackButton
						label={m['screens.search.explore.back']()}
						onClick={(evt) => {
							evt.preventDefault();
							navigateToExplore();
						}}
					/>
				}
				noBottomBorder
				placeholder={m['screens.search.input.placeholder']()}
			/>
			<div className={css.body}>
				<SearchResults
					activeTab={activeTab}
					headerHeight={headerHeight}
					onTabChange={setActiveTab}
					query={query}
					queryWithParams={queryWithParams}
				/>
			</div>
		</Layout.Screen>
	);
}
