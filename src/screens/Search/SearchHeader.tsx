import type { ReactNode, Ref } from 'react';

import type { AnyProfileView } from '@atcute/bluesky';

import { makeSearchQuery, type Params, type TabParam } from '#/screens/Search/utils';

import { SearchAutocomplete } from '#/components/SearchAutocomplete/SearchAutocomplete';
import * as Layout from '#/components/web/Layout';
import { useNavigateToPath } from '#/components/web/Link';

import { useNavigate } from '#/routes';

/**
 * the search chrome shared by the Explore, Search, and ProfileSearch screens: a sticky header wrapping the
 * autocomplete input. submitting always hands off to the Search results screen, prefixing any fixed params.
 *
 * @param fixedParams query filters prefixed to every submitted search (e.g. the profile-search `from:`
 *   filter)
 * @param headerRef forwarded to the header element so callers can measure its height
 * @param initialQuery query to seed the input with; a trailing space is appended so the caret opens on a
 *   fresh token
 * @param navButton the leading navigation button (menu on Explore, back on the results/profile screens)
 * @param noBottomBorder drops the header's bottom border when the content below draws its own
 * @param placeholder input placeholder text
 * @param tab results tab to land on when the query is submitted; carries the caller's active or pending tab
 *   over to the Search screen
 */
export function SearchHeader({
	fixedParams,
	headerRef,
	initialQuery,
	navButton,
	noBottomBorder,
	placeholder,
	tab,
}: {
	fixedParams?: Params;
	headerRef?: Ref<HTMLDivElement>;
	initialQuery: string;
	navButton: ReactNode;
	noBottomBorder?: boolean;
	placeholder: string;
	tab?: TabParam;
}) {
	const navigate = useNavigate();
	const navigateToPath = useNavigateToPath();

	const navigateToQuery = (nextQuery: string) => {
		window.scrollTo(0, 0);
		// lead with any fixed params (e.g. the profile-search `from:` filter), then the typed query, and hand
		// off to the Search screen. refining always pushes, so back returns to the previous query; the tab
		// carries over so a stashed tab lands on the right results.
		const prefix = fixedParams ? makeSearchQuery('', fixedParams) : '';
		const q = [prefix, nextQuery].filter(Boolean).join(' ');
		navigate('Search', { q, tab });
	};

	const navigateToProfile = (profile: AnyProfileView) => {
		navigate('Profile', { actor: profile.did });
	};

	return (
		<Layout.Header.Outer noBottomBorder={noBottomBorder} ref={headerRef}>
			{navButton}

			<Layout.Header.Content>
				<SearchAutocomplete
					eager
					initialQuery={initialQuery ? initialQuery + ' ' : initialQuery}
					placeholder={placeholder}
					onNavigate={(path) => navigateToPath(path, 'push')}
					onNavigateToProfile={navigateToProfile}
					onSubmit={navigateToQuery}
				/>
			</Layout.Header.Content>
		</Layout.Header.Outer>
	);
}
