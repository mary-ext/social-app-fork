import { memo } from 'react';

import type { Wordgard } from 'wordgard/editor';

import { getSelectionErrorMessage } from '#/features/composer/media/attachment-messages';
import { type AltTextTarget, ImageAltTextDialog } from '#/features/composer/photos/ImageAltTextDialog';

import * as Dialog from '#/components/Dialog';
import { Text } from '#/components/Text';

import type { ThreadDnd } from '../dnd/channel';
import { findPostById, getPostText, type PostMedia, splitMedia } from '../editor/schema';
import type { PostSummary } from '../editor/thread-analysis';
import { escapeToEditor, useDialogFocusReturn, useRovingFocus } from '../focus';
import { setMediaAlt } from './alt-text';
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
	const { media, altTexts } = post;
	const roving = useRovingFocus(
		media.map((item) => item.id),
		isActive,
	);

	const altDialog = Dialog.useDialogHandle<AltTextTarget & { mediaId: string }>();
	const focusReturn = useDialogFocusReturn(wg);

	if (media.length === 0 && !post.mediaProblem) {
		return null;
	}

	const { images, others } = splitMedia(media);

	const editAlt = (item: PostMedia) => {
		if (item.kind !== 'image') {
			// TODO: support alt text for GIFs, videos, and voice notes.
			return;
		}

		// read current text on open; the row doesn't rerender for text edits.
		const found = findPostById(wg.state.doc, post.id);

		focusReturn.capture();
		altDialog.openWithPayload({
			mediaId: item.id,
			blob: item.file,
			alt: altTexts.get(item.id) ?? '',
			context: {
				siblingAlts: images
					.filter((image) => image.id !== item.id)
					.map((image) => altTexts.get(image.id) ?? ''),
				text: found ? getPostText(found.node) : '',
			},
		});
	};

	return (
		<>
			<div
				className={styles.root}
				onKeyDown={(event) => {
					escapeToEditor(wg, event);
					roving.onKeyDown(event);
				}}
			>
				{images.length > 0 && (
					<ImageGroup
						wg={wg}
						dnd={dnd}
						postId={post.id}
						images={images}
						altTexts={altTexts}
						roving={roving}
						dropSlot={dropSlot}
						onEditAlt={editAlt}
					/>
				)}

				{others.map((item, index) => (
					<MediaTile
						key={item.id}
						wg={wg}
						dnd={dnd}
						postId={post.id}
						index={images.length + index}
						item={item}
						hasAlt={altTexts.has(item.id)}
						layout="stack"
						roving={roving.item(item.id)}
						onEditAlt={() => editAlt(item)}
					/>
				))}

				{post.mediaProblem && (
					<Text size="md_sub" color="negative_600">
						{getSelectionErrorMessage(post.mediaProblem)}
					</Text>
				)}
			</div>

			{/* keep dialog events out of the row's focus and key handlers. */}
			<ImageAltTextDialog
				handle={altDialog}
				onSave={(alt, { mediaId }) => setMediaAlt(wg, mediaId, alt)}
				finalFocus={focusReturn.finalFocus}
			/>
		</>
	);
});
