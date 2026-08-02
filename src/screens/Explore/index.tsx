import { useState } from 'react';

import { useFocusEffect } from '@oomfware/stacker';

import { useTitle } from '#/lib/hooks/useTitle';

import { focusSearch, softReset } from '#/state/events';
import { useSession } from '#/state/session';

import { SearchHeader } from '#/screens/Search/SearchHeader';
import type { TabParam } from '#/screens/Search/utils';

import { EmptyState } from '#/components/EmptyState';
import { MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlassIcon } from '#/components/icons/MagnifyingGlass';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import { Explore } from './Explore';
import * as css from './index.css';

export function ExploreScreen() {
	const { hasSession } = useSession();
	const [pendingTab, setPendingTab] = useState<TabParam | undefined>(undefined);

	useTitle(m['common.nav.explore']());

	// stash the tab so a subsequent search submit lands on the matching results tab
	const focusSearchInput = (tab: 'feed' | 'profile' | 'user') => {
		setPendingTab(tab);
		focusSearch.emit();
	};

	// already on the explore page — a soft reset just focuses the search field
	useFocusEffect(() => softReset.subscribe(() => focusSearch.emit()));

	return (
		<Layout.Screen>
			<SearchHeader
				initialQuery=""
				navButton={<Layout.Header.MenuButton />}
				placeholder={m['screens.search.input.placeholder']()}
				tab={pendingTab}
			/>
			<div className={css.body}>
				{hasSession ? (
					<Explore focusSearchInput={focusSearchInput} />
				) : (
					<EmptyState
						icon={MagnifyingGlassIcon}
						iconColor={colors.textContrastMedium}
						iconSize="_4xl"
						message={m['screens.search.input.description']()}
						messageColor="textContrastMedium"
					/>
				)}
			</div>
		</Layout.Screen>
	);
}
