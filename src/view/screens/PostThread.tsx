import { useTitle } from '#/lib/hooks/useTitle';
import { makeRecordUri } from '#/lib/strings/url-helpers';

import { usePostQuery } from '#/state/queries/post';

import { PostThread } from '#/screens/PostThread';

import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { useParams } from '#/routes';

export function PostThreadScreen() {
	const [{ name, rkey }] = useParams('PostThread');
	const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey);
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
