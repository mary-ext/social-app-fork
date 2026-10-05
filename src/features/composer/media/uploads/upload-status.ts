import { useSyncExternalStore } from 'react';

import { m } from '#/paraglide/messages';

import { useComposer } from '../../context';
import { isPendingUpload, type PendingUpload, type VideoUploadState } from './video-uploads';

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
 * subscribes to average upload progress across the given files.
 *
 * @param files the attachments' files
 * @returns rounded percent, counting completed files as 100%; null if no upload is pending
 */
export const useUploadsProgress = (files: readonly File[]): number | null => {
	const { uploads } = useComposer();

	return useSyncExternalStore(uploads.subscribe, () => {
		let isPending = false;
		let total = 0;
		for (const file of files) {
			const state = uploads.getState(file);
			if (isPendingUpload(state)) {
				isPending = true;
				total += state.progress;
			} else if (state?.status === 'done') {
				total += 1;
			}
		}

		return isPending ? Math.round((total / files.length) * 100) : null;
	});
};

/**
 * formats upload progress for display.
 *
 * @param upload the pending upload
 * @returns a localized status label
 */
export const getUploadLabel = (upload: PendingUpload): string => {
	switch (upload.status) {
		case 'compressing': {
			return m['features.composer.media.upload.compressing']();
		}
		case 'uploading': {
			return m['features.composer.media.upload.uploading']({ percent: Math.round(upload.sent * 100) });
		}
		case 'processing': {
			return m['features.composer.media.upload.processing']();
		}
	}
};
