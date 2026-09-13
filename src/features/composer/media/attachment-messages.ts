import { VIDEO_MAX_DURATION_MINUTES, VIDEO_MAX_SIZE_MB } from '#/lib/constants/video';
import type { AttachmentKind, AttachmentRejection } from '#/lib/media/read-attachment';

import { MAX_GALLERY_IMAGES } from '#/features/composer/state/composer';

import { m } from '#/paraglide/messages';

import type { SelectionError } from './select-attachments';

const getUnsupportedMessage = (kind: AttachmentKind | undefined, mimeType: string): string => {
	switch (kind) {
		case 'gif':
		case 'video': {
			return m['view.composer.video.error.unsupportedType']({ mimeType });
		}
		case 'voice': {
			return m['view.composer.voice.error.unsupportedType']({ mimeType });
		}
		case 'image':
		case undefined: {
			return m['view.composer.video.error.fileUnsupported']();
		}
	}
};

const getTooLongMessage = (kind: 'gif' | 'video' | 'voice'): string => {
	const minutes = VIDEO_MAX_DURATION_MINUTES;
	switch (kind) {
		case 'gif': {
			return m['view.composer.gif.error.tooLong']({ minutes });
		}
		case 'video': {
			return m['view.composer.video.error.tooLong']({ minutes });
		}
		case 'voice': {
			return m['view.composer.voice.error.tooLong']({ minutes });
		}
	}
};

const getOneOnlyMessage = (kind: 'gif' | 'video' | 'voice'): string => {
	switch (kind) {
		case 'gif': {
			return m['view.composer.gif.error.oneOnly']();
		}
		case 'video': {
			return m['view.composer.video.error.oneOnly']();
		}
		case 'voice': {
			return m['view.composer.voice.error.oneOnly']();
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
			return m['view.composer.video.error.fileTooLarge']({ max: VIDEO_MAX_SIZE_MB });
		}
		case 'tooLong': {
			return getTooLongMessage(rejection.kind);
		}
	}
};

/**
 * describes why a file in a batch was left out.
 *
 * @param error validation failure or selection limit
 * @returns a localized message
 */
export const getSelectionErrorMessage = (error: SelectionError): string => {
	switch (error.type) {
		case 'rejected': {
			return getAttachmentRejectionMessage(error.rejection);
		}
		case 'mixedTypes': {
			return m['view.composer.media.multipleTypes']();
		}
		case 'maxImages': {
			return m['view.composer.gallery.error.maxSelect']({ max: MAX_GALLERY_IMAGES });
		}
		case 'oneOnly': {
			return getOneOnlyMessage(error.kind);
		}
	}
};
