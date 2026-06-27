import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { AllNavigatorParams } from '#/lib/routes/types';

import { PostFeed } from '#/view/com/posts/PostFeed';
import { EmptyState } from '#/view/com/util/EmptyState';

import { EditBig_Stroke1_Corner0_Rounded as EditIcon } from '#/components/icons/EditBig';
import * as Layout from '#/components/Layout';
import { ListFooter } from '#/components/Lists';

import { m } from '#/paraglide/messages';

type Props = NativeStackScreenProps<AllNavigatorParams, 'NotificationsActivityList'>;
export function NotificationsActivityListScreen({
	route: {
		params: { posts },
	},
}: Props) {
	return (
		<Layout.Screen testID="NotificationsActivityListScreen">
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.nav.notifications']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<PostFeed
				feed={`posts|${posts}`}
				disablePoll
				renderEmptyState={() => (
					<EmptyState icon={EditIcon} iconSize="2xl" message={m['screens.notifications.empty']()} />
				)}
				renderEndOfFeed={() => <ListFooter />}
			/>
		</Layout.Screen>
	);
}
