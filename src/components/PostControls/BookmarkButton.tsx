import { memo } from 'react';
import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { Trans, useLingui } from '@lingui/react/macro';

import { useCleanError } from '#/lib/hooks/useCleanError';

import type { Shadow } from '#/state/cache/post-shadow';
import { useFeedFeedbackContext } from '#/state/feed-feedback';
import { useBookmarkMutation } from '#/state/queries/bookmarks/useBookmarkMutation';
import { useRequireAuth } from '#/state/session';

import { useTheme } from '#/alf';

import { Bookmark, BookmarkFilled } from '#/components/icons/Bookmark';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import * as toast from '#/components/Toast';

import { PostControlButton, PostControlButtonIcon } from './PostControlButton';

export const BookmarkButton = memo(function BookmarkButton({
	post,
	big,
	logContext: _logContext,
}: {
	post: Shadow<AppBskyFeedDefs.PostView>;
	big?: boolean;
	logContext: 'FeedItem' | 'PostThreadItem' | 'Post';
}): React.ReactNode {
	const t = useTheme();
	const { t: l } = useLingui();
	const { mutateAsync: bookmark } = useBookmarkMutation();
	const cleanError = useCleanError();
	const requireAuth = useRequireAuth();
	const { feedDescriptor: _feedDescriptor } = useFeedFeedbackContext();

	const { viewer } = post;
	const isBookmarked = !!viewer?.bookmarked;

	const undoLabel = l({
		message: `Undo`,
		context: `Button label to undo saving/removing a post from saved posts.`,
	});

	const save = async ({ disableUndo }: { disableUndo?: boolean } = {}) => {
		try {
			await bookmark({
				action: 'create',
				post,
			});

			toast.show(
				<toast.Outer>
					<toast.Icon />
					<toast.Text>
						<Trans>Post saved</Trans>
					</toast.Text>
					{!disableUndo && (
						<toast.Action label={undoLabel} onPress={() => void remove({ disableUndo: true })}>
							{undoLabel}
						</toast.Action>
					)}
				</toast.Outer>,
				{
					type: 'success',
				},
			);
		} catch (e) {
			const { raw, clean } = cleanError(e);
			toast.show(clean || raw || String(e), {
				type: 'error',
			});
		}
	};

	const remove = async ({ disableUndo }: { disableUndo?: boolean } = {}) => {
		try {
			await bookmark({
				action: 'delete',
				uri: post.uri,
			});

			toast.show(
				<toast.Outer>
					<toast.Icon icon={TrashIcon} />
					<toast.Text>
						<Trans>Removed from saved posts</Trans>
					</toast.Text>
					{!disableUndo && (
						<toast.Action label={undoLabel} onPress={() => void save({ disableUndo: true })}>
							{undoLabel}
						</toast.Action>
					)}
				</toast.Outer>,
			);
		} catch (e) {
			const { raw, clean } = cleanError(e);
			toast.show(clean || raw || String(e), {
				type: 'error',
			});
		}
	};

	const onHandlePress = () =>
		requireAuth(async () => {
			if (isBookmarked) {
				await remove();
			} else {
				await save();
			}
		});

	return (
		<PostControlButton
			big={big}
			active={isBookmarked}
			activeColor={t.palette.primary_500}
			label={isBookmarked ? l`Remove from saved posts` : l`Add to saved posts`}
			onClick={onHandlePress}
		>
			<PostControlButtonIcon icon={isBookmarked ? BookmarkFilled : Bookmark} />
		</PostControlButton>
	);
});
