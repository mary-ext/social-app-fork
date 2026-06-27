import { Plural } from '@lingui/react/macro';

import { useSetTitle } from '#/lib/hooks/useSetTitle';
import type { CommonNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';
import { makeRecordUri } from '#/lib/strings/url-helpers';

import { usePostQuery } from '#/state/queries/post';

import { PostRepostedBy as PostRepostedByComponent } from '#/view/com/post-thread/PostRepostedBy';

import * as Layout from '#/components/Layout';

import { m } from '#/paraglide/messages';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostRepostedBy'>;
export const PostRepostedByScreen = ({ route }: Props) => {
	const { name, rkey } = route.params;
	const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey);
	const { data: post } = usePostQuery(uri);

	useSetTitle(post ? m['common.a11y.postByAuthor']({ handle: post.author.handle }) : undefined);

	let quoteCount;
	if (post) {
		quoteCount = post.repostCount;
	}

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					{post && (
						<>
							<Layout.Header.TitleText>{m['screens.post.label.repostedBy']()}</Layout.Header.TitleText>
							<Layout.Header.SubtitleText>
								<Plural value={quoteCount ?? 0} one="# repost" other="# reposts" />
							</Layout.Header.SubtitleText>
						</>
					)}
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<PostRepostedByComponent uri={uri} />
		</Layout.Screen>
	);
};
