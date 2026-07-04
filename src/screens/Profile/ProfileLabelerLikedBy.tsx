import type { CommonNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';
import { makeRecordUri } from '#/lib/strings/url-helpers';

import { LikedByList } from '#/components/LikedByList';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';

export function ProfileLabelerLikedByScreen({
	route,
}: NativeStackScreenProps<CommonNavigatorParams, 'ProfileLabelerLikedBy'>) {
	const { name: handleOrDid } = route.params;
	const uri = makeRecordUri(handleOrDid, 'app.bsky.labeler.service', 'self');
	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.like.likedByTitle']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<LikedByList uri={uri} />
		</Layout.Screen>
	);
}
