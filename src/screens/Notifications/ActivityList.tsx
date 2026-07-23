import { useTitle } from '#/lib/hooks/useTitle';

import { PostFeed } from '#/view/com/posts/PostFeed';
import { EmptyState } from '#/view/com/util/EmptyState';

import { EditBig_Stroke1_Corner0_Rounded as EditIcon } from '#/components/icons/EditBig';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { useParams } from '#/routes';

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
				feed={`posts|${posts}`}
				disablePoll
				renderEmptyState={() => (
					<EmptyState icon={EditIcon} iconSize="2xl" message={m['view.notifications.activity.empty']()} />
				)}
			/>
		</Layout.Screen>
	);
}
