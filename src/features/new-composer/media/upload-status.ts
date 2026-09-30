import { useEffect, useState } from 'react';

import type { PostMedia } from '../editor/schema';

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

/**
 * simulates upload progress without uploading the attachment.
 *
 * @param item the media entry
 * @returns simulated status, or null for images
 */
export const useUploadStatus = (item: PostMedia): UploadStatus | null => {
	const [now, setNow] = useState(() => performance.now());

	const status = item.kind === 'image' ? null : getStatusAt(now - getStartTime(item.id));
	const isSettled = status === null || status.status === 'done';

	useEffect(() => {
		if (isSettled) {
			return;
		}

		const interval = setInterval(() => setNow(performance.now()), 100);
		return () => clearInterval(interval);
	}, [isSettled]);

	return status;
};
