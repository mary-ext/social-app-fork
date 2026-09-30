import { memo } from 'react';

import type { Wordgard } from 'wordgard/editor';

import { getSelectionErrorMessage } from '#/features/composer/media/attachment-messages';

import { Text } from '#/components/Text';

import type { ThreadDnd } from '../dnd/channel';
import type { PostSummary } from '../editor/thread-analysis';
import { MediaGrid } from './MediaGrid';
import * as styles from './MediaRow.css';

/**
 * a post's attachments and media errors.
 *
 * @param props the editor, post summary, drag state, and keyboard focus state
 * @returns the media row, or null if there are no attachments or errors
 */
export const MediaRow = memo(function MediaRow({
	wg,
	dnd,
	post,
	isActive,
	dropSlot,
}: {
	wg: Wordgard;
	dnd: ThreadDnd;
	post: PostSummary;
	isActive: boolean;
	dropSlot: number | null;
}) {
	if (post.media.length === 0 && !post.mediaProblem) {
		return null;
	}

	return (
		<div className={styles.root}>
			{post.media.length > 0 && (
				<MediaGrid
					wg={wg}
					dnd={dnd}
					postId={post.id}
					media={post.media}
					isActive={isActive}
					dropSlot={dropSlot}
				/>
			)}

			{post.mediaProblem && (
				<Text size="md_sub" color="negative_600">
					{getSelectionErrorMessage(post.mediaProblem)}
				</Text>
			)}
		</div>
	);
});
