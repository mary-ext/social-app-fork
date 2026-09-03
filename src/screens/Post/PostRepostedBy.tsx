import type { AppBskyActorDefs as ActorDefs } from '@atcute/bluesky';

import { makeRecordUri } from '#/lib/at-uri';
import { cleanError } from '#/lib/errors';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { usePostQuery } from '#/state/queries/post';
import { usePostRepostedByQuery } from '#/state/queries/post-reposted-by';
import { useResolveUriQuery } from '#/state/queries/resolve-uri';
import { useTitle } from '#/state/use-title';

import { BlankState } from '#/components/BlankState';
import { ErrorState } from '#/components/ErrorState';
import { List } from '#/components/List/List';
import * as ListTail from '#/components/List/ListTail';
import * as Layout from '#/components/web/Layout';
import * as ProfileCard from '#/components/web/ProfileCard';

import RepostIcon from '#/icons/central/ArrowsRepeatRightLeft_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useParams } from '#/router';

export const PostRepostedByScreen = () => {
	const [{ actor, rkey }] = useParams('PostRepostedBy');
	const uri = makeRecordUri(actor, 'app.bsky.feed.post', rkey);
	const { data: post } = usePostQuery(uri);

	const quoteCount = post?.repostCount;

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
							<Layout.Header.TitleText>{m['screens.post.repost.title']()}</Layout.Header.TitleText>
							<Layout.Header.SubtitleText>
								{m['screens.post.repost.count']({ count: quoteCount ?? 0 })}
							</Layout.Header.SubtitleText>
						</>
					)}
				</Layout.Header.Content>
			</Layout.Header.Outer>
			<PostRepostedBy uri={uri} initialCount={quoteCount} />
		</Layout.Screen>
	);
};

const PROFILE_ITEM_HEIGHT_ESTIMATE = 130;

function keyExtractor(item: ActorDefs.ProfileView) {
	return item.did;
}

function PostRepostedBy({ uri, initialCount }: { uri: string; initialCount?: number }) {
	const moderationOpts = useModerationOpts();

	const { data: resolvedUri, error: resolveError } = useResolveUriQuery(uri);
	const { data, isPending, isFetchingNextPage, fetchNextPage, error, refetch } = usePostRepostedByQuery(
		resolvedUri?.uri,
	);

	const isError = !!(resolveError || error);

	const repostedBy = data?.pages ? data.pages.flatMap((page) => page.repostedBy) : [];

	if (isError && repostedBy.length < 1) {
		return <ErrorState onRetry={() => void refetch()} />;
	}

	// the paged query stays pending while the uri resolves, so this covers both fetches
	if (isPending || !moderationOpts) {
		return <ProfileCard.LoadingPlaceholder count={initialCount} />;
	}

	if (repostedBy.length < 1) {
		return <BlankState icon={RepostIcon} message={m['screens.postThread.engagement.repost.emptyPrompt']()} />;
	}

	return (
		<List
			data={repostedBy}
			estimateHeight={PROFILE_ITEM_HEIGHT_ESTIMATE}
			keyExtractor={keyExtractor}
			ListFooterComponent={
				<ListTail.Frame>
					{isFetchingNextPage ? (
						<ListTail.Pending />
					) : isError ? (
						<ListTail.Error message={cleanError(error)} onRetry={() => void fetchNextPage()} />
					) : null}
				</ListTail.Frame>
			}
			renderItem={({ index, item }) => (
				<ProfileCard.Default moderationOpts={moderationOpts} profile={item} topBorder={index !== 0} />
			)}
			onEndReached={() => {
				if (isError) {
					return;
				}
				void fetchNextPage();
			}}
			onEndReachedThreshold={2}
		/>
	);
}
