import { memo } from 'react';

import type { Wordgard } from 'wordgard/editor';

import { getSelectionErrorMessage } from '#/features/composer/media/attachment-messages';

import { Text } from '#/components/Text';

import type { ThreadDnd } from '../dnd/channel';
import { splitMedia } from '../editor/schema';
import type { PostSummary } from '../editor/thread-analysis';
import { escapeToEditor, useRovingFocus } from '../focus';
import { ImageGroup } from './ImageGroup';
import * as styles from './MediaRow.css';
import { MediaTile } from './MediaTile';

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
	const { media } = post;
	const roving = useRovingFocus(
		media.map((item) => item.id),
		isActive,
	);

	if (media.length === 0 && !post.mediaProblem) {
		return null;
	}

	const { images, others } = splitMedia(media);

	return (
		<div
			className={styles.root}
			onKeyDown={(event) => {
				escapeToEditor(wg, event);
				roving.onKeyDown(event);
			}}
		>
			{images.length > 0 && (
				<ImageGroup wg={wg} dnd={dnd} postId={post.id} images={images} roving={roving} dropSlot={dropSlot} />
			)}

			{others.map((item, index) => (
				<MediaTile
					key={item.id}
					wg={wg}
					dnd={dnd}
					postId={post.id}
					index={images.length + index}
					item={item}
					layout="stack"
					roving={roving.item(item.id)}
				/>
			))}

			{post.mediaProblem && (
				<Text size="md_sub" color="negative_600">
					{getSelectionErrorMessage(post.mediaProblem)}
				</Text>
			)}
		</div>
	);
});
