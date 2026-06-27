import type { AppBskyFeedDefs } from '@atcute/bluesky';

import { useCleanError } from '#/lib/hooks/useCleanError';

import type { Shadow } from '#/state/cache/post-shadow';
import { useBookmarkMutation } from '#/state/queries/bookmarks/useBookmarkMutation';
import { useRequireAuth } from '#/state/session';

import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import * as toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

/**
 * The save/remove-bookmark action shared by both action-bar sizes. Returns the toggle state, its accessible
 * label, and a press handler; the rendering component owns the button chrome and the filled/outline icon.
 */
export function useBookmark(post: Shadow<AppBskyFeedDefs.PostView>) {
	const { mutateAsync: bookmark } = useBookmarkMutation();
	const cleanError = useCleanError();
	const requireAuth = useRequireAuth();

	const isBookmarked = !!post.viewer?.bookmarked;

	const undoLabel = m['components.postControls.save.undo']();

	const save = async ({ disableUndo }: { disableUndo?: boolean } = {}) => {
		try {
			await bookmark({
				action: 'create',
				post,
			});

			toast.show(m['components.postControls.save.toast'](), {
				action: disableUndo
					? undefined
					: { label: undoLabel, onPress: () => void remove({ disableUndo: true }) },
				type: 'success',
			});
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

			toast.show(m['common.savedPosts.removedToast'](), {
				action: disableUndo
					? undefined
					: { label: undoLabel, onPress: () => void save({ disableUndo: true }) },
				icon: TrashIcon,
			});
		} catch (e) {
			const { raw, clean } = cleanError(e);
			toast.show(clean || raw || String(e), {
				type: 'error',
			});
		}
	};

	const onToggle = () =>
		requireAuth(async () => {
			if (isBookmarked) {
				await remove();
			} else {
				await save();
			}
		});

	return {
		isBookmarked,
		label: isBookmarked ? m['common.savedPosts.remove']() : m['components.postControls.save.action'](),
		onToggle,
	};
}
