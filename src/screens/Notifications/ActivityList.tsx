import { useTitle } from '#/state/use-title';

import { EmptyState } from '#/components/EmptyState';
import { PostFeed } from '#/components/PostFeed/PostFeed';
import * as Layout from '#/components/web/Layout';

import EditIcon from '#/icons/central/EditBig_round_outlined_radius3_stroke1.svg';
import { m } from '#/paraglide/messages';
import { useParams } from '#/router';

export function NotificationsActivityListScreen() {
	const [{ posts }] = useParams('NotificationsActivityList');

	useTitle(m['common.nav.notifications']());

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.nav.notifications']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
			</Layout.Header.Outer>
			<PostFeed
				feed={{ type: 'posts', uris: posts }}
				disablePoll
				renderEmptyState={() => (
					<EmptyState icon={EditIcon} iconSize="_2xl" message={m['view.notifications.activity.empty']()} />
				)}
			/>
		</Layout.Screen>
	);
}
