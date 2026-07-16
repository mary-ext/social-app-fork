import { useCallback } from 'react';

import { useFocusEffect } from '@oomfware/stacker';

import { useTitle } from '#/lib/hooks/useTitle';
import { MagnifyingGlassIcon } from '#/lib/icons';

import { focusSearch, softReset } from '#/state/events';
import { useSession } from '#/state/session';

import { SearchHeader } from '#/screens/Search/SearchHeader';

import { Text } from '#/components/Text';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { useParams } from '#/routes';
import { colors } from '#/styles/colors';

import { Explore } from './Explore';
import * as css from './index.css';

export function ExploreScreen() {
	const { hasSession } = useSession();
	const [, setParams] = useParams('Explore');

	useTitle(m['common.nav.explore']());

	// stash the tab on the route so a subsequent search submit lands on the matching results tab
	const focusSearchInput = (tab: 'feed' | 'profile' | 'user') => {
		focusSearch.emit();
		setParams({ tab });
	};

	useFocusEffect(
		useCallback(() => {
			// already on the explore page — a soft reset just focuses the search field
			return softReset.subscribe(() => focusSearch.emit());
		}, []),
	);

	return (
		<Layout.Screen>
			<SearchHeader
				initialQuery=""
				navButton={<Layout.Header.MenuButton />}
				placeholder={m['screens.search.input.placeholder']()}
			/>
			<div className={css.body}>
				{hasSession ? (
					<Explore focusSearchInput={focusSearchInput} />
				) : (
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
				)}
			</div>
		</Layout.Screen>
	);
}
