import { Mp4OutputFormat, WebMOutputFormat, type OutputFormat } from 'mediabunny';

import type { VideoUploadMimeType } from '#/lib/constants/video';

export type ContainerName = 'mp4' | 'webm';

type Container = {
	mimeType: VideoUploadMimeType;
	createFormat: () => OutputFormat;
};

export const CONTAINERS: Record<ContainerName, Container> = {
	mp4: {
		mimeType: 'video/mp4',
		// uploads do not need progressive playback; skip fast-start metadata relocation.
		createFormat: () => new Mp4OutputFormat({ fastStart: false }),
	},
	webm: {
		mimeType: 'video/webm',
		createFormat: () => new WebMOutputFormat(),
	},
};
