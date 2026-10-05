import type { ImageAltTextTarget } from '#/features/composer/photos/ImageAltTextDialog';

import * as Dialog from '#/components/Dialog';
import type { EditImageTarget } from '#/components/EditImageDialog/EditImageDialog';

import type { LabelsTarget } from './labels/LabelsDialog';
import type { ExternalGifAltTextTarget } from './media/external-gifs/ExternalGifAltTextDialog';
import type { GifAltTextTarget } from './media/gifs/GifAltTextDialog';
import type { VideoCaptionsTarget } from './media/videos/CaptionsDialog';
import type { VideoAltTextTarget } from './media/videos/VideoAltTextDialog';
import type { VoiceAltTextTarget } from './media/voices/VoiceAltTextDialog';

type MediaPayload<T> = T & { mediaId: string };

export type ComposerDialogHandles = {
	captions: Dialog.DialogHandle<MediaPayload<VideoCaptionsTarget>>;
	editImage: Dialog.DialogHandle<MediaPayload<EditImageTarget>>;
	externalGifAlt: Dialog.DialogHandle<MediaPayload<ExternalGifAltTextTarget>>;
	gifAlt: Dialog.DialogHandle<MediaPayload<GifAltTextTarget>>;
	imageAlt: Dialog.DialogHandle<MediaPayload<ImageAltTextTarget>>;
	/** keys from `getAttachmentKeys` identify which attachments receive the labels. */
	labels: Dialog.DialogHandle<LabelsTarget & { keys: readonly string[] }>;
	videoAlt: Dialog.DialogHandle<MediaPayload<VideoAltTextTarget>>;
	voiceAlt: Dialog.DialogHandle<MediaPayload<VoiceAltTextTarget>>;
};

/**
 * creates dialog handles for one composer.
 *
 * @returns handles used by `ComposerDialogs`
 */
export const createComposerDialogs = (): ComposerDialogHandles => {
	return {
		captions: Dialog.createHandle(),
		editImage: Dialog.createHandle(),
		externalGifAlt: Dialog.createHandle(),
		gifAlt: Dialog.createHandle(),
		imageAlt: Dialog.createHandle(),
		labels: Dialog.createHandle(),
		videoAlt: Dialog.createHandle(),
		voiceAlt: Dialog.createHandle(),
	};
};
