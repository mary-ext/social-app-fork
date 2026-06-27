import type { CommonNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';
import { makeRecordUri } from '#/lib/strings/url-helpers';

import { ViewHeader } from '#/view/com/util/ViewHeader';

import * as Layout from '#/components/Layout';
import { LikedByList } from '#/components/LikedByList';

import { m } from '#/paraglide/messages';

export function ProfileLabelerLikedByScreen({
	route,
}: NativeStackScreenProps<CommonNavigatorParams, 'ProfileLabelerLikedBy'>) {
	const { name: handleOrDid } = route.params;
	const uri = makeRecordUri(handleOrDid, 'app.bsky.labeler.service', 'self');
	return (
		<Layout.Screen>
			<ViewHeader title={m['common.title.likedBy']()} />
			<LikedByList uri={uri} />
		</Layout.Screen>
	);
}
