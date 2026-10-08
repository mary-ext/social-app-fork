import type { Composer } from '../context';
import { findPostById, getPostParam, getPostText, type PostMedia, type VideoMedia } from '../model/schema';
import { getMediaAlt } from './alt-text';
import { type EditableImage, getEditedImage, getImageEdit } from './images/image-edits';
import { getMediaCaptions } from './videos/captions';

type DialogComposer = Pick<Composer, 'dialogs' | 'wg'>;

/**
 * opens the alt text editor for an attachment.
 *
 * @param composer editor and dialog handles
 * @param postId the attachment's post ID, used for image description context
 * @param item the attachment
 */
export const openAltText = ({ dialogs, wg }: DialogComposer, postId: string, item: PostMedia): void => {
	const { state } = wg;
	const mediaId = item.id;
	const alt = getMediaAlt(state, mediaId);

	switch (item.kind) {
		case 'image': {
			const post = findPostById(state.doc, postId);
			const siblings = post ? getPostParam(post.node).media : [];

			dialogs.imageAlt.openWithPayload({
				mediaId,
				file: getEditedImage(item, getImageEdit(state, mediaId)).blob,
				alt,
				context: {
					siblingAlts: siblings
						.filter((other) => other.kind === 'image' && other.id !== mediaId)
						.map((other) => getMediaAlt(state, other.id)),
					text: post ? getPostText(post.node) : '',
				},
			});
			break;
		}
		case 'gif': {
			dialogs.gifAlt.openWithPayload({ mediaId, file: item.file, alt });
			break;
		}
		case 'externalGif': {
			dialogs.externalGifAlt.openWithPayload({ mediaId, gif: item.gif, alt });
			break;
		}
		case 'video': {
			dialogs.videoAlt.openWithPayload({ mediaId, file: item.file, alt });
			break;
		}
		case 'voice': {
			dialogs.voiceAlt.openWithPayload({ mediaId, item, alt });
			break;
		}
	}
};

/**
 * opens the captions editor for a video.
 *
 * @param composer editor and dialog handles
 * @param item the video
 */
export const openCaptions = ({ dialogs, wg }: DialogComposer, item: VideoMedia): void => {
	dialogs.captions.openWithPayload({ mediaId: item.id, tracks: getMediaCaptions(wg.state, item.id) });
};

/**
 * opens the image editor with the attachment's saved crop settings.
 *
 * @param composer editor and dialog handles
 * @param item the image
 */
export const openImageEditor = ({ dialogs, wg }: DialogComposer, item: EditableImage): void => {
	dialogs.editImage.openWithPayload({
		mediaId: item.id,
		source: { blob: item.file, ...item.dimensions },
		manips: getImageEdit(wg.state, item.id)?.manips,
	});
};
