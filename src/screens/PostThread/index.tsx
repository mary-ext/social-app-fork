import { makeRecordUri } from '#/lib/at-uri';

import { usePostQuery } from '#/state/queries/post';
import { useTitle } from '#/state/use-title';

import { PostThread } from '#/screens/PostThread/PostThread';

import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { useParams } from '#/routes';

export function PostThreadScreen() {
	const [{ actor, rkey }] = useParams('PostThread');
	const uri = makeRecordUri(actor, 'app.bsky.feed.post', rkey);
	const { data: post } = usePostQuery(uri);

	useTitle(
		post ? m['common.a11y.postByAuthor']({ handle: post.author.handle }) : m['navigation.post.title'](),
	);

	return (
		<Layout.Screen>
			<PostThread uri={uri} />
		</Layout.Screen>
	);
}
