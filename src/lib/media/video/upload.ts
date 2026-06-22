import type { AppBskyVideoDefs } from '@atcute/bluesky';
import type { Client } from '@atcute/client';
import type { I18n } from '@lingui/core';
import { defineMessage } from '@lingui/core/macro';

import { AbortError } from '#/lib/async/cancelable';
import { ServerError } from '#/lib/media/video/errors';
import type { CompressedVideo } from '#/lib/media/video/types';

import { getServiceAuthToken, getVideoUploadLimits } from './upload.shared';
import { createVideoEndpointUrl, mimeToExt } from './util';

export async function uploadVideo({
	video,
	pds,
	dispatchUrl,
	did,
	setProgress,
	signal,
	i18n,
}: {
	video: CompressedVideo;
	pds: Client;
	dispatchUrl: string;
	did: string;
	setProgress: (progress: number) => void;
	signal: AbortSignal;
	i18n: I18n;
}) {
	if (signal.aborted) {
		throw new AbortError();
	}
	await getVideoUploadLimits({ pds, dispatchUrl, i18n });

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
		xhr.onloadend = () => {
			if (signal.aborted) {
				reject(new AbortError());
			} else if (xhr.readyState === 4) {
				const uploadRes = JSON.parse(xhr.responseText) as AppBskyVideoDefs.JobStatus;
				resolve(uploadRes);
			} else {
				reject(new ServerError(i18n._(defineMessage`Failed to upload video`)));
			}
		};
		xhr.onerror = () => {
			reject(new ServerError(i18n._(defineMessage`Failed to upload video`)));
		};
		xhr.open('POST', uri);
		xhr.setRequestHeader('Content-Type', video.mimeType);
		xhr.setRequestHeader('Authorization', `Bearer ${token}`);
		xhr.send(video.blob);
	});

	if (!res.jobId) {
		throw new ServerError(res.error || i18n._(defineMessage`Failed to upload video`));
	}

	if (signal.aborted) {
		throw new AbortError();
	}
	return res;
}
