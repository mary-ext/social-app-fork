import type { AppBskyBookmarkDefs, AppBskyFeedDefs } from '@atcute/bluesky';
import type { $type } from '@atcute/lexicons';

import { useNavigation } from '@react-navigation/native';

import type { CommonNavigatorParams, NavigationProp, NativeStackScreenProps } from '#/lib/routes/types';
import { cleanError } from '#/lib/strings/errors';

import { useBookmarkMutation } from '#/state/queries/bookmarks/useBookmarkMutation';
import { useBookmarksQuery } from '#/state/queries/bookmarks/useBookmarksQuery';

import { Post } from '#/view/com/post/Post';
import { PostFeedLoadingPlaceholder } from '#/view/com/posts/PostFeedLoadingPlaceholder';
import { EmptyState } from '#/view/com/util/EmptyState';

import { BookmarkDeleteLarge, BookmarkFilled } from '#/components/icons/Bookmark';
import { CircleQuestion_Stroke2_Corner2_Rounded as QuestionIcon } from '#/components/icons/CircleQuestion';
import { List, type ListRenderItemInfo } from '#/components/List/List';
import { ListFooter } from '#/components/Lists';
import { Text } from '#/components/Text';
import * as toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';
import * as Skele from '#/components/web/Skeleton';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './Bookmarks.css';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Bookmarks'>;

export function BookmarksScreen({}: Props) {
	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{m['common.savedPosts.title']()}</Layout.Header.TitleText>
				</Layout.Header.Content>
			</Layout.Header.Outer>
			<BookmarksInner />
		</Layout.Screen>
	);
}

type ListItem =
	| {
			type: 'loading';
			key: 'loading';
	  }
	| {
			type: 'empty';
			key: 'empty';
	  }
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

// only governs rows that have never been on screen; the browser reuses the real size once rendered.
const BOOKMARK_ITEM_HEIGHT_ESTIMATE = 300;

function BookmarksInner() {
	const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, error } = useBookmarksQuery();

	const onEndReached = async () => {
		if (isFetchingNextPage || !hasNextPage || error) return;
		await fetchNextPage();
	};

	const items: ListItem[] = [];
	if (isLoading) {
		items.push({ type: 'loading', key: 'loading' });
	} else if (!error && data) {
		const bookmarks = data.pages.flatMap((p) => p.bookmarks);

		if (bookmarks.length > 0) {
			for (const bookmark of bookmarks) {
				if (bookmark.item.$type === 'app.bsky.feed.defs#notFoundPost') {
					items.push({
						type: 'bookmarkNotFound',
						key: bookmark.item.uri,
						bookmark: {
							...bookmark,
							item: bookmark.item,
						},
					});
				}
				if (bookmark.item.$type === 'app.bsky.feed.defs#postView') {
					items.push({
						type: 'bookmark',
						key: bookmark.item.uri,
						bookmark: {
							...bookmark,
							item: bookmark.item,
						},
					});
				}
			}
		} else {
			items.push({ type: 'empty', key: 'empty' });
		}
	}

	const isEmpty = items.length === 1 && items[0]?.type === 'empty';

	const renderItem = ({ index, item }: ListRenderItemInfo<ListItem>) => {
		switch (item.type) {
			case 'loading':
				return <PostFeedLoadingPlaceholder />;
			case 'empty':
				return <BookmarksEmpty />;
			case 'bookmark':
				return <BookmarkItem item={item} hideTopBorder={index === 0} />;
			case 'bookmarkNotFound':
				return <BookmarkNotFound post={item.bookmark.item} hideTopBorder={index === 0} />;
			default:
				return null;
		}
	};

	return (
		<List
			data={items}
			estimateHeight={BOOKMARK_ITEM_HEIGHT_ESTIMATE}
			keyExtractor={keyExtractor}
			renderItem={renderItem}
			ListFooterComponent={
				<ListFooter
					isFetchingNextPage={isFetchingNextPage}
					error={cleanError(error)}
					onRetry={fetchNextPage}
					className={isEmpty ? css.footerNoBorder : undefined}
				/>
			}
			onEndReached={() => void onEndReached()}
			onEndReachedThreshold={2}
		/>
	);
}

const keyExtractor = (item: ListItem) => item.key;

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
				<QuestionIcon size="xl" fill={colors.textContrastLow} />
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

function BookmarksEmpty() {
	const navigation = useNavigation<NavigationProp>();

	return (
		<EmptyState
			icon={BookmarkDeleteLarge}
			message={m['screens.bookmarks.empty']()}
			messageColor="textContrastMedium"
			button={{
				label: m['screens.bookmarks.backHome'](),
				text: m['common.action.goHome'](),
				onPress: () => navigation.navigate('Home' as never),
				size: 'small',
				color: 'secondary',
			}}
			className={css.empty}
		/>
	);
}
