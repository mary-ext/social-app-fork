import { useTitle } from '#/lib/hooks/useTitle';
import { makeRecordUri } from '#/lib/strings/url-helpers';

import { usePostQuery } from '#/state/queries/post';

import { LikedByList } from '#/components/LikedByList';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { useParams } from '#/routes';

export const PostLikedByScreen = () => {
	const [{ actor, rkey }] = useParams('PostLikedBy');
	const uri = makeRecordUri(actor, 'app.bsky.feed.post', rkey);
	const { data: post } = usePostQuery(uri);

	const likeCount = post?.likeCount;

	useTitle(
		post ? m['common.a11y.postByAuthor']({ handle: post.author.handle }) : m['navigation.post.title'](),
	);

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					{post && (
						<>
							<Layout.Header.TitleText>{m['common.like.likedByTitle']()}</Layout.Header.TitleText>
							<Layout.Header.SubtitleText>
								{m['screens.post.like.count']({ count: likeCount ?? 0 })}
							</Layout.Header.SubtitleText>
						</>
					)}
				</Layout.Header.Content>
			</Layout.Header.Outer>
			<LikedByList uri={uri} initialCount={likeCount} />
		</Layout.Screen>
	);
};
