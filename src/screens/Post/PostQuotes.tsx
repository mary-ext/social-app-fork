import { useSetTitle } from '#/lib/hooks/useSetTitle';
import type { CommonNavigatorParams, NativeStackScreenProps } from '#/lib/routes/types';
import { makeRecordUri } from '#/lib/strings/url-helpers';

import { usePostQuery } from '#/state/queries/post';

import { PostQuotes as PostQuotesComponent } from '#/view/com/post-thread/PostQuotes';

import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'PostQuotes'>;
export const PostQuotesScreen = ({ route }: Props) => {
	const { name, rkey } = route.params;
	const uri = makeRecordUri(name, 'app.bsky.feed.post', rkey);
	const { data: post } = usePostQuery(uri);

	useSetTitle(post ? m['common.a11y.postByAuthor']({ handle: post.author.handle }) : undefined);

	let quoteCount;
	if (post) {
		quoteCount = post.quoteCount;
	}

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					{post && (
						<>
							<Layout.Header.TitleText>{m['common.quote.label']()}</Layout.Header.TitleText>
							<Layout.Header.SubtitleText>
								{m['screens.post.quote.count']({ count: quoteCount ?? 0 })}
							</Layout.Header.SubtitleText>
						</>
					)}
				</Layout.Header.Content>
				<Layout.Header.Slot />
			</Layout.Header.Outer>
			<PostQuotesComponent uri={uri} />
		</Layout.Screen>
	);
};
