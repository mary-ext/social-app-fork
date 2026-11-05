import { makeRecordUri } from '#/lib/at-uri';
import { postPageTitle } from '#/lib/post-title';

import { usePostQuery } from '#/state/queries/post/post';
import { useTitle } from '#/state/use-title';

import { PostThread } from '#/screens/PostThread/PostThread';

import * as Layout from '#/components/web/Layout';

import { useParams } from '#/router';

export function PostThreadScreen() {
	const [{ actor, rkey }] = useParams('PostThread');
	const uri = makeRecordUri(actor, 'app.bsky.feed.post', rkey);
	const { data: post } = usePostQuery(uri);

	useTitle(postPageTitle(post));

	return (
		<Layout.Screen>
			<PostThread uri={uri} />
		</Layout.Screen>
	);
}
