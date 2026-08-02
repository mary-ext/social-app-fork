import type { AppBskyFeedDefs } from '@atcute/bluesky';

import { useCleanError } from '#/lib/hooks/useCleanError';

import type { Shadow } from '#/state/cache/post-shadow';
import { useBookmarkMutation } from '#/state/queries/bookmarks/useBookmarkMutation';
import { useRequireAuth } from '#/state/session';

import * as toast from '#/components/Toast';

import TrashIcon from '#/icons/central/TrashCan_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

/**
 * shares the save/remove bookmark action between action-bar sizes, returning the toggle state, accessible
 * label, and press handler.
 *
 * @returns toggle state, accessible label, and press handler.
 */
export function useBookmark(post: Shadow<AppBskyFeedDefs.PostView>) {
	const { mutateAsync: bookmark } = useBookmarkMutation();
	const cleanError = useCleanError();
	const requireAuth = useRequireAuth();

	const isBookmarked = !!post.viewer?.bookmarked;

	const undoLabel = m['common.action.undo']();

	// saving is confirmed by the button's own filled state, so it stays quiet; only removal toasts, because
	// there the post leaves the list and an undo is worth offering.
	const save = async () => {
		try {
			await bookmark({
				action: 'create',
				post,
			});
		} catch (e) {
			const { raw, clean } = cleanError(e);
			toast.show(clean || raw || String(e), {
				type: 'error',
			});
		}
	};

	const remove = async () => {
		try {
			await bookmark({
				action: 'delete',
				uri: post.uri,
			});

			toast.show(m['common.savedPosts.removedToast'](), {
				action: { label: undoLabel, onPress: () => void save() },
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
