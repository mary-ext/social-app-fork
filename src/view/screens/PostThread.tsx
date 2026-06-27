import { useSetTitle } from '#/lib/hooks/useSetTitle';
import type { CommonNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';
import { makeRecordUri } from '#/lib/strings/url-helpers';

import { usePostQuery } from '#/state/queries/post';

import { PostThread } from '#/screens/PostThread';

import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostThread'>;
export function PostThreadScreen({ route }: Props) {
	const { name, rkey } = route.params;
	const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey);
	const { data: post } = usePostQuery(uri);

	useSetTitle(post ? m['common.a11y.postByAuthor']({ handle: post.author.handle }) : undefined);

	return (
		<Layout.Screen>
			<PostThread uri={uri} />
		</Layout.Screen>
	);
}
