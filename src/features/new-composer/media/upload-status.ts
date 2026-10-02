import { useEffect, useState } from 'react';

import { m } from '#/paraglide/messages';

export type PendingUpload =
	| { status: 'compressing' }
	| { status: 'uploading'; progress: number }
	| { status: 'processing' };

const COMPRESS_MS = 1_500;
const UPLOAD_MS = 4_000;
const PROCESS_MS = 1_500;

const COMPRESSING: PendingUpload = { status: 'compressing' };
const PROCESSING: PendingUpload = { status: 'processing' };

// preserve simulated progress across tile remounts without retaining removed files.
const startTimes = new WeakMap<Blob, number>();

const getStartTime = (file: Blob): number => {
	let start = startTimes.get(file);
	if (start === undefined) {
		start = performance.now();
		startTimes.set(file, start);
	}

	return start;
};

const getStatusAt = (elapsed: number): PendingUpload | null => {
	if (elapsed < COMPRESS_MS) {
		return COMPRESSING;
	}
	if (elapsed < COMPRESS_MS + UPLOAD_MS) {
		return { status: 'uploading', progress: (elapsed - COMPRESS_MS) / UPLOAD_MS };
	}
	if (elapsed < COMPRESS_MS + UPLOAD_MS + PROCESS_MS) {
		return PROCESSING;
	}

	return null;
};

/**
 * simulates upload progress; no file is uploaded.
 *
 * @param file the attachment's file
 * @returns simulated status, or null when the simulation finishes
 */
export const usePendingUpload = (file: Blob): PendingUpload | null => {
	const [status, setStatus] = useState(() => getStatusAt(performance.now() - getStartTime(file)));
	const isDone = status === null;

	useEffect(() => {
		if (isDone) {
			return;
		}

		const interval = setInterval(() => {
			setStatus(getStatusAt(performance.now() - getStartTime(file)));
		}, 100);
		return () => clearInterval(interval);
	}, [file, isDone]);

	return status;
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
			return m['view.composer.media.upload.compressing']();
		}
		case 'uploading': {
			return m['view.composer.media.upload.uploading']({ percent: Math.round(upload.progress * 100) });
		}
		case 'processing': {
			return m['view.composer.media.upload.processing']();
		}
	}
};
