import type { AppBskyVideoDefs } from '@atcute/bluesky';
import type { Client } from '@atcute/client';

import { AbortError } from '#/lib/async/cancelable';
import { ServerError } from '#/lib/media/video/errors';
import type { CompressedVideo } from '#/lib/media/video/types';

import { m } from '#/paraglide/messages';

import { getServiceAuthToken, getVideoUploadLimits } from './upload.shared';
import { createVideoEndpointUrl, mimeToExt } from './util';

export async function uploadVideo({
	video,
	pds,
	dispatchUrl,
	did,
	setProgress,
	signal,
}: {
	video: CompressedVideo;
	pds: Client;
	dispatchUrl: string;
	did: string;
	setProgress: (progress: number) => void;
	signal: AbortSignal;
}) {
	if (signal.aborted) {
		throw new AbortError();
	}
	await getVideoUploadLimits({ pds, dispatchUrl });

	const uri = createVideoEndpointUrl('/xrpc/app.bsky.video.uploadVideo', {
		did,
		name: `${crypto.randomUUID()}.${mimeToExt(video.mimeType)}`,
	});

	if (signal.aborted) {
		throw new AbortError();
	}
	const token = await getServiceAuthToken({
		pds,
		dispatchUrl,
		lxm: 'com.atproto.repo.uploadBlob',
		exp: Math.floor(Date.now() / 1000) + 60 * 30, // 30 minutes; must be an integer (unix seconds)
	});

	if (signal.aborted) {
		throw new AbortError();
	}
	const xhr = new XMLHttpRequest();
	const res = await new Promise<AppBskyVideoDefs.JobStatus>((resolve, reject) => {
		xhr.upload.addEventListener('progress', (e) => {
			const progress = e.loaded / e.total;
			setProgress(progress);
		});
		xhr.addEventListener(
			'loadend',
			() => {
				if (signal.aborted) {
					reject(new AbortError());
				} else if (xhr.readyState === 4) {
					const uploadRes: AppBskyVideoDefs.JobStatus = JSON.parse(xhr.responseText);
					resolve(uploadRes);
				} else {
					reject(new ServerError(m['lib.video.uploadFailed']()));
				}
			},
			{ once: true },
		);
		xhr.addEventListener(
			'error',
			() => {
				reject(new ServerError(m['lib.video.uploadFailed']()));
			},
			{ once: true },
		);
		xhr.open('POST', uri);
		xhr.setRequestHeader('Content-Type', video.mimeType);
		xhr.setRequestHeader('Authorization', `Bearer ${token}`);
		xhr.send(video.blob);
	});

	if (!res.jobId) {
		throw new ServerError(res.error || m['lib.video.uploadFailed']());
	}

	if (signal.aborted) {
		throw new AbortError();
	}
	return res;
}
