import { useState } from 'react';

import type { ComposerImage } from '#/lib/media/composer-image';

import { getSelectionErrorMessage } from '#/features/composer/media/attachment-messages';
import { type AltTextTarget, ImageAltTextDialog } from '#/features/composer/photos/ImageAltTextDialog';

import * as Dialog from '#/components/Dialog';
import { EditImageDialog } from '#/components/EditImageDialog/EditImageDialog';
import { Text } from '#/components/Text';

import { useEditor, useIsActivePost, usePostState } from '../context';
import { findPostById, getPostParam, getPostText, type PostMedia, splitMedia } from '../editor/schema';
import { escapeToEditor, useRovingFocus } from '../focus';
import { getMediaAlt, setMediaAlt } from './alt-text';
import { getMediaProblem } from './attachments';
import {
	type EditableImage,
	getEditedImage,
	getImageEdit,
	saveComposerImage,
	toComposerImage,
} from './image-edits';
import { ImageGroup } from './ImageGroup';
import * as styles from './MediaRow.css';
import { MediaTile } from './MediaTile';

const NO_MEDIA: readonly PostMedia[] = [];

/**
 * a post's attachments and media errors.
 *
 * @param props the post's id
 * @returns the media row, or null if there are no attachments
 */
export function MediaRow({ postId }: { postId: string }) {
	const wg = useEditor();
	// media keeps its identity through text edits, since posts keep their tags.
	const media = usePostState(postId, (_state, post) => getPostParam(post.node).media, NO_MEDIA);
	const isActive = useIsActivePost(postId);

	const roving = useRovingFocus(
		media.map((item) => item.id),
		isActive,
	);

	const altDialog = Dialog.useDialogHandle<AltTextTarget & { mediaId: string }>();
	const editDialog = Dialog.useDialogHandle();
	// retain the image through the dialog's exit animation.
	const [editing, setEditing] = useState<ComposerImage>();

	if (media.length === 0) {
		return null;
	}

	const mediaProblem = getMediaProblem(media);
	const { images, others } = splitMedia(media);

	const editAlt = (item: PostMedia) => {
		if (item.kind !== 'image') {
			// TODO: support alt text for GIFs, videos, and voice notes.
			return;
		}

		const { state } = wg;
		const found = findPostById(state.doc, postId);

		altDialog.openWithPayload({
			mediaId: item.id,
			blob: getEditedImage(item, getImageEdit(state, item.id)).blob,
			alt: getMediaAlt(state, item.id),
			context: {
				siblingAlts: images
					.filter((image) => image.id !== item.id)
					.map((image) => getMediaAlt(state, image.id)),
				text: found ? getPostText(found.node) : '',
			},
		});
	};

	const editImage = (item: EditableImage) => {
		setEditing(toComposerImage(item, getImageEdit(wg.state, item.id)));
		editDialog.open(null);
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
						postId={postId}
						images={images}
						roving={roving}
						onEditAlt={editAlt}
						onEditImage={editImage}
					/>
				)}

				{others.map((item, index) => (
					<MediaTile
						key={item.id}
						postId={postId}
						index={images.length + index}
						item={item}
						layout={item.kind === 'externalGif' ? 'single' : 'stack'}
						roving={roving.item(item.id)}
						onEditAlt={() => editAlt(item)}
					/>
				))}

				{mediaProblem && (
					<Text size="md_sub" color="negative_600">
						{getSelectionErrorMessage(mediaProblem)}
					</Text>
				)}
			</div>

			{/* keep dialog events out of the row's focus and key handlers. */}
			<ImageAltTextDialog handle={altDialog} onSave={(alt, { mediaId }) => setMediaAlt(wg, mediaId, alt)} />
			<EditImageDialog
				handle={editDialog}
				image={editing}
				onChange={(image) => saveComposerImage(wg, image)}
			/>
		</>
	);
}
