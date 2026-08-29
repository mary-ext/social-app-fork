import { useTitle } from '#/state/use-title';

import { BookmarksTab } from '#/screens/History/Bookmarks';
import { LikesTab } from '#/screens/History/Likes';

import { type Section, Tabs } from '#/components/Tabs';
import * as Layout from '#/components/web/Layout';
import { HEADER_HEIGHT } from '#/components/web/Layout/const';

import BookmarkIcon from '#/icons/central/Bookmark_round_outlined_radius0_stroke2.svg';
import HeartIcon from '#/icons/central/Heart2_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useParams } from '#/router';

export function HistoryScreen() {
	useTitle(m['common.nav.history']());

	const [{ tab }, replaceParams] = useParams('History');

	const sections: Section<'likes' | 'saved'>[] = [
		{
			id: 'saved',
			icon: BookmarkIcon,
			label: m['common.nav.saved'](),
			children: <BookmarksTab />,
		},
		{
			id: 'likes',
			icon: HeartIcon,
			label: m['common.like.label'](),
			children: <LikesTab />,
		},
	];

	return (
		<Layout.Screen>
			<Tabs
				headerOffset={HEADER_HEIGHT}
				sections={sections}
				value={tab ?? 'saved'}
				onValueChange={(next) => replaceParams({ tab: next })}
				header={
					<Layout.Header.Outer noBottomBorder>
						<Layout.Header.BackButton />
						<Layout.Header.Content>
							<Layout.Header.TitleText>{m['common.nav.history']()}</Layout.Header.TitleText>
						</Layout.Header.Content>
					</Layout.Header.Outer>
				}
			/>
		</Layout.Screen>
	);
}
