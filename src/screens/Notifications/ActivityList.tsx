import { useTitle } from '#/state/use-title';

import { BlankState } from '#/components/BlankState';
import { PostFeed } from '#/components/PostFeed/PostFeed';
import * as Layout from '#/components/web/Layout';

import BellIcon from '#/icons/central/Bell_round_outlined_radius1_stroke2.svg';
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
					<BlankState icon={BellIcon} message={m['view.notifications.activity.empty']()} />
				)}
			/>
		</Layout.Screen>
	);
}
