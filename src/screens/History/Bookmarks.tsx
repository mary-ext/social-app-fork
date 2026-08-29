import type { AppBskyBookmarkDefs, AppBskyFeedDefs } from '@atcute/bluesky';
import type { $type } from '@atcute/lexicons';

import { mapDefined } from '@mary/array-fns';

import { cleanError } from '#/lib/errors';

import { useBookmarkMutation } from '#/state/queries/bookmarks/useBookmarkMutation';
import { useBookmarksQuery } from '#/state/queries/bookmarks/useBookmarksQuery';

import { List, type ListRenderItemInfo } from '#/components/List/List';
import { ListEmpty } from '#/components/List/ListEmpty';
import { ListError } from '#/components/List/ListError';
import * as ListTail from '#/components/List/ListTail';
import { Post } from '#/components/Post/Post';
import { PostFeedLoadingPlaceholder } from '#/components/PostFeed/PostFeedLoadingPlaceholder';
import { Text } from '#/components/Text';
import * as toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Skele from '#/components/web/Skeleton';

import BookmarkFilled from '#/icons/central/Bookmark_round_filled_radius1_stroke2.svg';
import BookmarkDeleteLarge from '#/icons/central/BookmarkDelete_round_outlined_radius3_stroke1.svg';
import QuestionIcon from '#/icons/central/CircleQuestionmark_round_outlined_radius3_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useRouter } from '#/router';

import * as css from './Bookmarks.css';

type ListItem =
	| {
			type: 'bookmark';
			key: string;
			bookmark: Omit<AppBskyBookmarkDefs.BookmarkView, 'item'> & {
				item: $type.enforce<AppBskyFeedDefs.PostView>;
			};
	  }
	| {
			type: 'bookmarkNotFound';
			key: string;
			bookmark: Omit<AppBskyBookmarkDefs.BookmarkView, 'item'> & {
				item: $type.enforce<AppBskyFeedDefs.NotFoundPost>;
			};
	  };

const BOOKMARK_ITEM_HEIGHT_ESTIMATE = 300;

function renderItem({ index, item }: ListRenderItemInfo<ListItem>) {
	switch (item.type) {
		case 'bookmark': {
			return <BookmarkItem item={item} hideTopBorder={index === 0} />;
		}
		case 'bookmarkNotFound': {
			return <BookmarkNotFound post={item.bookmark.item} hideTopBorder={index === 0} />;
		}
		default: {
			return null;
		}
	}
}

const keyExtractor = (item: ListItem) => item.key;

export function BookmarksTab() {
	const router = useRouter();
	const { data, error, fetchNextPage, isError, isFetchingNextPage, isPending, refetch } = useBookmarksQuery();

	const items =
		data?.pages.flatMap((page) => {
			return mapDefined(page.bookmarks, ({ item, subject, createdAt }): ListItem | undefined => {
				switch (item.$type) {
					case 'app.bsky.feed.defs#notFoundPost': {
						return {
							type: 'bookmarkNotFound',
							key: item.uri,
							bookmark: { item, subject, createdAt },
						};
					}
					case 'app.bsky.feed.defs#postView': {
						return {
							type: 'bookmark',
							key: item.uri,
							bookmark: { item, subject, createdAt },
						};
					}
				}
			});
		}) ?? [];

	if (items.length < 1) {
		if (isError) {
			return <ListError message={cleanError(error)} onRetry={() => void refetch()} />;
		}

		if (isPending) {
			return <PostFeedLoadingPlaceholder />;
		}

		return (
			<ListEmpty
				className={css.empty}
				icon={BookmarkDeleteLarge}
				message={m['screens.bookmarks.empty']()}
				button={{
					label: m['screens.bookmarks.backHome'](),
					text: m['common.action.goHome'](),
					onPress: () => router.navigate({ to: { name: 'Home' } }),
					size: 'small',
					color: 'secondary',
				}}
			/>
		);
	}

	return (
		<List
			data={items}
			estimateHeight={BOOKMARK_ITEM_HEIGHT_ESTIMATE}
			keyExtractor={keyExtractor}
			renderItem={renderItem}
			ListFooterComponent={
				<ListTail.Frame>
					{isFetchingNextPage ? (
						<ListTail.Pending />
					) : isError ? (
						<ListTail.Error message={cleanError(error)} onRetry={() => void fetchNextPage()} />
					) : null}
				</ListTail.Frame>
			}
			onEndReached={() => void fetchNextPage()}
			onEndReachedThreshold={2}
		/>
	);
}

function BookmarkNotFound({
	hideTopBorder,
	post,
}: {
	hideTopBorder: boolean;
	post: $type.enforce<AppBskyFeedDefs.NotFoundPost>;
}) {
	const { mutateAsync: bookmark } = useBookmarkMutation();

	const remove = async () => {
		try {
			await bookmark({ action: 'delete', uri: post.uri });
			toast.show(m['common.savedPosts.removedToast'](), {
				type: 'info',
			});
		} catch (e) {
			toast.show(cleanError(e), {
				type: 'error',
			});
		}
	};

	return (
		<div className={css.notFoundRow({ topBorder: !hideTopBorder })}>
			<div className={css.deletedAvatar}>
				<QuestionIcon className={css.questionIcon} />
			</div>
			<Skele.Col gap="xs">
				<Skele.Text size="md" width="25%" />

				<Text className={css.deletedMessage} color="textContrastMedium" size="md">
					{m['screens.bookmarks.deletedPost']()}
				</Text>
			</Skele.Col>
			<Button
				label={m['common.savedPosts.remove']()}
				size="tiny"
				color="secondary"
				onClick={() => void remove()}
			>
				<ButtonIcon icon={BookmarkFilled} />
				<ButtonText>{m['common.action.remove']()}</ButtonText>
			</Button>
		</div>
	);
}

function BookmarkItem({
	item,
	hideTopBorder,
}: {
	item: Extract<ListItem, { type: 'bookmark' }>;
	hideTopBorder: boolean;
}) {
	return <Post post={item.bookmark.item} hideTopBorder={hideTopBorder} />;
}
