import { useSetTitle } from '#/lib/hooks/useSetTitle';
import type { CommonNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';
import { makeRecordUri } from '#/lib/strings/url-helpers';

import { usePostQuery } from '#/state/queries/post';

import { PostLikedBy as PostLikedByComponent } from '#/view/com/post-thread/PostLikedBy';

import * as Layout from '#/components/Layout';

import { m } from '#/paraglide/messages';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostLikedBy'>;
export const PostLikedByScreen = ({ route }: Props) => {
	const { name, rkey } = route.params;
	const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey);
	const { data: post } = usePostQuery(uri);

	useSetTitle(post ? m['common.a11y.postByAuthor']({ handle: post.author.handle }) : undefined);

	let likeCount;
	if (post) {
		likeCount = post.likeCount;
	}

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
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<PostLikedByComponent uri={uri} />
		</Layout.Screen>
	);
};
