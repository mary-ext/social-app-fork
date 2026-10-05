import { MAX_GALLERY_IMAGES } from '#/lib/constants/composer';
import { VIDEO_MAX_DURATION_MINUTES, VIDEO_MAX_SIZE_MB } from '#/lib/constants/video';

import { m } from '#/paraglide/messages';

import type { SelectionError } from './attachments';
import type { AttachmentKind, AttachmentRejection, VideoAttachmentKind } from './read-attachment';

const getUnsupportedMessage = (kind: AttachmentKind | undefined, mimeType: string): string => {
	switch (kind) {
		case 'gif':
		case 'video': {
			return m['features.composer.media.video.error.unsupportedType']({ mimeType });
		}
		case 'voice': {
			return m['features.composer.media.voice.error.unsupportedType']({ mimeType });
		}
		case 'image':
		case undefined: {
			return m['features.composer.media.error.fileUnsupported']();
		}
	}
};

const getTooLongMessage = (kind: VideoAttachmentKind): string => {
	const minutes = VIDEO_MAX_DURATION_MINUTES;
	switch (kind) {
		case 'gif': {
			return m['features.composer.media.gif.error.tooLong']({ minutes });
		}
		case 'video': {
			return m['features.composer.media.video.error.tooLong']({ minutes });
		}
		case 'voice': {
			return m['features.composer.media.voice.error.tooLong']({ minutes });
		}
	}
};

const getOneOnlyMessage = (kind: VideoAttachmentKind): string => {
	switch (kind) {
		case 'gif': {
			return m['features.composer.media.gif.error.oneOnly']();
		}
		case 'video': {
			return m['features.composer.media.video.error.oneOnly']();
		}
		case 'voice': {
			return m['features.composer.media.voice.error.oneOnly']();
		}
	}
};

/**
 * describes why a file can't be attached.
 *
 * @param rejection file validation failure
 * @returns a localized message
 */
export const getAttachmentRejectionMessage = (rejection: AttachmentRejection): string => {
	switch (rejection.reason) {
		case 'unsupported': {
			return getUnsupportedMessage(rejection.kind, rejection.mimeType);
		}
		case 'tooLarge': {
			return m['features.composer.media.error.fileTooLarge']({ max: VIDEO_MAX_SIZE_MB });
		}
		case 'tooLong': {
			return getTooLongMessage(rejection.kind);
		}
	}
};

/**
 * describes a post's media type or count violation.
 *
 * @param error the violation
 * @returns a localized message
 */
export const getSelectionErrorMessage = (error: SelectionError): string => {
	switch (error.type) {
		case 'mixedTypes': {
			return m['features.composer.media.error.multipleTypes']();
		}
		case 'maxImages': {
			return m['features.composer.media.image.error.maxSelect']({ max: MAX_GALLERY_IMAGES });
		}
		case 'oneOnly': {
			return getOneOnlyMessage(error.kind);
		}
	}
};
