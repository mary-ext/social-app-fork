import { useLayoutEffect, useRef, useState } from 'react';

import { useFocusEffect } from '@oomfware/stacker';

import { softReset } from '#/state/events';

import { SearchHeader } from '#/screens/Search/SearchHeader';
import { makeSearchQuery, parseSearchQuery } from '#/screens/Search/utils';

import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { useParams, useRouter } from '#/router';

import { SearchResults } from './SearchResults';
import * as css from './Shell.css';

export function SearchScreenShell({ queryParam }: { queryParam: string }) {
	const router = useRouter();
	const [{ tab }, replaceParams] = useParams('Search');
	const activeTab = tab ?? 'top';

	const { params, query } = parseSearchQuery(queryParam || '');
	const queryWithParams = makeSearchQuery(query, params);

	// measure the sticky header so the tab bar below it can offset itself by that height
	const [headerHeight, setHeaderHeight] = useState(0);
	const headerRef = useRef<HTMLDivElement | null>(null);
	useLayoutEffect(() => {
		const el = headerRef.current;
		if (!el) {
			return;
		}
		const measure = () => setHeaderHeight(el.getBoundingClientRect().height);
		measure();
		const observer = new ResizeObserver(measure);
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	const navigateToExplore = () => {
		// drop back to the explore page: clear the query and tab
		router.navigate({ to: { name: 'Explore' } });
	};

	useFocusEffect(() => softReset.subscribe(navigateToExplore));

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
				tab={tab}
			/>
			<div className={css.body}>
				<SearchResults
					activeTab={activeTab}
					headerHeight={headerHeight}
					onTabChange={(next) => replaceParams({ tab: next })}
					query={query}
					queryWithParams={queryWithParams}
				/>
			</div>
		</Layout.Screen>
	);
}
