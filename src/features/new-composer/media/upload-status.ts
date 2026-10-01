import { useEffect, useState } from 'react';

import { m } from '#/paraglide/messages';

export type UploadStatus =
	| { status: 'compressing' }
	| { status: 'uploading'; progress: number }
	| { status: 'processing' }
	| { status: 'done' };

const COMPRESS_MS = 1_500;
const UPLOAD_MS = 4_000;
const PROCESS_MS = 1_500;

// preserve simulated progress when a tile moves between posts.
const startTimes = new Map<string, number>();

const getStartTime = (mediaId: string): number => {
	let start = startTimes.get(mediaId);
	if (start === undefined) {
		start = performance.now();
		startTimes.set(mediaId, start);
	}

	return start;
};

const getStatusAt = (elapsed: number): UploadStatus => {
	if (elapsed < COMPRESS_MS) {
		return { status: 'compressing' };
	}
	if (elapsed < COMPRESS_MS + UPLOAD_MS) {
		return { status: 'uploading', progress: (elapsed - COMPRESS_MS) / UPLOAD_MS };
	}
	if (elapsed < COMPRESS_MS + UPLOAD_MS + PROCESS_MS) {
		return { status: 'processing' };
	}

	return { status: 'done' };
};

export type PendingUpload = Exclude<UploadStatus, { status: 'done' }>;

/**
 * simulates upload progress; no file is uploaded.
 *
 * @param mediaId the attachment's id
 * @returns simulated status, or null when the simulation finishes
 */
export const usePendingUpload = (mediaId: string): PendingUpload | null => {
	const [now, setNow] = useState(() => performance.now());

	const status = getStatusAt(now - getStartTime(mediaId));
	const isDone = status.status === 'done';

	useEffect(() => {
		if (isDone) {
			return;
		}

		const interval = setInterval(() => setNow(performance.now()), 100);
		return () => clearInterval(interval);
	}, [isDone]);

	return isDone ? null : status;
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
