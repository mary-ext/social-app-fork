import { useSyncExternalStore } from 'react';

import { m } from '#/paraglide/messages';

import { useComposer } from '../../context';
import { isPendingUpload, type PendingUpload, toPercent, type VideoUploadState } from './video-uploads';

/**
 * subscribes to an attachment's upload.
 *
 * @param file the attachment's file
 * @returns the upload's state, or undefined if it isn't tracked
 */
export const useVideoUpload = (file: File): VideoUploadState | undefined => {
	const { uploads } = useComposer();

	return useSyncExternalStore(uploads.subscribe, () => uploads.getState(file));
};

/**
 * subscribes to the files whose upload failed.
 *
 * @returns the failed files
 */
export const useFailedUploads = (): ReadonlySet<File> => {
	const { uploads } = useComposer();

	return useSyncExternalStore(uploads.subscribe, uploads.getFailed);
};

/**
 * subscribes to pending uploads among the given files.
 *
 * @param files the attachments' files
 * @returns whether any file has a pending upload; see {@link isPendingUpload}
 */
export const useHasPendingUploads = (files: readonly File[]): boolean => {
	const { uploads } = useComposer();

	return useSyncExternalStore(uploads.subscribe, () => {
		return files.some((file) => isPendingUpload(uploads.getState(file)));
	});
};

/**
 * formats upload progress for display.
 *
 * @param upload the pending upload
 * @returns a localized label with the current step's progress
 */
export const getUploadLabel = ({ status, stepProgress }: PendingUpload): string => {
	const percent = toPercent(stepProgress);
	switch (status) {
		case 'compressing': {
			return m['features.composer.media.upload.compressing']({ percent });
		}
		case 'uploading': {
			return m['features.composer.media.upload.uploading']({ percent });
		}
		case 'processing': {
			return m['features.composer.media.upload.processing']({ percent });
		}
	}
};
