import { getSelectionErrorMessage } from '#/features/composer/media/attachment-messages';

import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';

import { useComposer, useIsActivePost, usePostState } from '../context';
import { getPostParam, type PostMedia, splitMedia } from '../model/schema';
import { escapeToEditor } from '../shared/editor-focus';
import { MEDIA_ID_ATTR } from '../shared/elements';
import { useRovingFocus } from '../shared/roving-focus';
import { getMediaProblem, isVideoUploadMedia } from './attachments';
import { removeMedia } from './commands';
import { ExternalGifTile } from './external-gifs/ExternalGifTile';
import { GifTile } from './gifs/GifTile';
import { ImageGroup } from './images/ImageGroup';
import { openAltText, openCaptions, openImageEditor } from './media-dialogs';
import * as css from './MediaRow.css';
import { refocusMedia } from './shared/MediaTile';
import { useVideoUpload } from './shared/upload-status';
import { VideoTile } from './videos/VideoTile';
import { VoiceTile } from './voices/VoiceTile';

const NO_MEDIA: readonly PostMedia[] = [];

function UploadError({ file }: { file: File }) {
	const upload = useVideoUpload(file);
	if (upload?.status !== 'failed') {
		return null;
	}

	return (
		<Text size="md_sub" color="negative_600">
			{upload.error}
			{upload.jobId !== null && ` (${m['view.composer.video.jobId']({ jobId: upload.jobId })})`}
		</Text>
	);
}

/**
 * a post's attachments and media errors.
 *
 * @param props the post's id
 * @returns the media row, or null if there are no attachments
 */
export function MediaRow({ postId }: { postId: string }) {
	const composer = useComposer();
	const { wg } = composer;
	// media keeps its identity through text edits, since posts keep their tags.
	const media = usePostState(postId, (_state, post) => getPostParam(post.node).media, NO_MEDIA);
	const isActive = useIsActivePost(postId);

	const roving = useRovingFocus(
		media.map((item) => item.id),
		{ tabbable: isActive },
	);

	const { images, others } = splitMedia(media);

	if (media.length === 0) {
		return null;
	}

	const mediaProblem = getMediaProblem(media);

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
					onEditAlt={(item) => openAltText(composer, postId, item)}
					onEditImage={(item) => openImageEditor(composer, item)}
					onRemove={remove}
				/>
			)}

			{others.map((item, index) => {
				const props = {
					postId,
					index: images.length + index,
					roving: roving.item(item.id),
					onEditAlt: () => openAltText(composer, postId, item),
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
						return (
							<VideoTile
								key={item.id}
								{...props}
								item={item}
								onEditCaptions={() => openCaptions(composer, item)}
							/>
						);
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

			{others.map((item) => isVideoUploadMedia(item) && <UploadError key={item.id} file={item.file} />)}
		</div>
	);
}
