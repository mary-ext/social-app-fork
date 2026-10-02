import { useState } from 'react';

import type { ComposerImage } from '#/lib/media/composer-image';

import { getSelectionErrorMessage } from '#/features/composer/media/attachment-messages';
import { type AltTextTarget, ImageAltTextDialog } from '#/features/composer/photos/ImageAltTextDialog';

import * as Dialog from '#/components/Dialog';
import { EditImageDialog } from '#/components/EditImageDialog/EditImageDialog';
import { Text } from '#/components/Text';

import { useEditor, useIsActivePost, usePostState } from '../context';
import { findPostById, getPostParam, getPostText, type PostMedia, splitMedia } from '../model/schema';
import { escapeToEditor } from '../shared/editor-focus';
import { MEDIA_ID_ATTR } from '../shared/elements';
import { useRovingFocus } from '../shared/roving-focus';
import { getMediaAlt, setMediaAlt } from './alt-text';
import { getMediaProblem } from './attachments';
import { removeMedia } from './commands';
import { ExternalGifTile } from './ExternalGifTile';
import { GifAltTextDialog, type GifAltTextTarget } from './GifAltTextDialog';
import { GifTile } from './GifTile';
import {
	type EditableImage,
	getEditedImage,
	getImageEdit,
	saveComposerImage,
	toComposerImage,
} from './image-edits';
import { ImageGroup } from './ImageGroup';
import * as css from './MediaRow.css';
import { refocusMedia } from './MediaTile';
import { VideoTile } from './VideoTile';
import { VoiceTile } from './VoiceTile';

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
		{ tabbable: isActive },
	);

	const altDialog = Dialog.useDialogHandle<AltTextTarget & { mediaId: string }>();
	const gifAltDialog = Dialog.useDialogHandle<GifAltTextTarget & { mediaId: string }>();
	const editDialog = Dialog.useDialogHandle();
	// retain the image through the dialog's exit animation.
	const [editing, setEditing] = useState<ComposerImage>();

	if (media.length === 0) {
		return null;
	}

	const mediaProblem = getMediaProblem(media);
	const { images, others } = splitMedia(media);

	const editAlt = (item: PostMedia) => {
		const { state } = wg;

		switch (item.kind) {
			case 'image': {
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
				break;
			}
			case 'externalGif': {
				gifAltDialog.openWithPayload({
					mediaId: item.id,
					gif: item.gif,
					alt: getMediaAlt(state, item.id),
				});
				break;
			}
			default: {
				// TODO: support alt text for local GIFs, videos, and voice notes.
				break;
			}
		}
	};

	const saveAlt = (alt: string, { mediaId }: { mediaId: string }) => {
		setMediaAlt(wg, { mediaId, alt });
	};

	const editImage = (item: EditableImage) => {
		setEditing(toComposerImage(item, getImageEdit(wg.state, item.id)));
		editDialog.open(null);
	};

	const remove = (item: PostMedia) => {
		// removing an unfocused tile must not steal focus from the editor.
		const focused = document.activeElement?.closest(`[${MEDIA_ID_ATTR}]`)?.getAttribute(MEDIA_ID_ATTR);
		const index = media.indexOf(item);
		const neighbor = media[index + 1] ?? media[index - 1];

		removeMedia(wg, { postId, mediaId: item.id });
		if (focused !== item.id) {
			return;
		}

		if (neighbor) {
			refocusMedia(neighbor.id);
		} else {
			wg.focus();
		}
	};

	return (
		<>
			<div
				className={css.root}
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
						onRemove={remove}
					/>
				)}

				{others.map((item, index) => {
					const props = {
						postId,
						index: images.length + index,
						roving: roving.item(item.id),
						onEditAlt: () => editAlt(item),
						onRemove: () => remove(item),
					};

					switch (item.kind) {
						case 'gif': {
							return <GifTile key={item.id} {...props} item={item} />;
						}
						case 'externalGif': {
							return <ExternalGifTile key={item.id} {...props} item={item} />;
						}
						case 'video': {
							return <VideoTile key={item.id} {...props} item={item} />;
						}
						case 'voice': {
							return <VoiceTile key={item.id} {...props} item={item} />;
						}
					}
				})}

				{mediaProblem && (
					<Text size="md_sub" color="negative_600">
						{getSelectionErrorMessage(mediaProblem)}
					</Text>
				)}
			</div>

			<ImageAltTextDialog handle={altDialog} onSave={saveAlt} />
			<GifAltTextDialog handle={gifAltDialog} onSave={saveAlt} />
			<EditImageDialog
				handle={editDialog}
				image={editing}
				onChange={(image) => saveComposerImage(wg, image)}
			/>
		</>
	);
}
