export const VIDEO_SERVICE = 'https://video.bsky.app';
/** Bluesky video CDN origin. */
export const VIDEO_CDN_SERVICE = 'https://video.cdn.bsky.app';

export const VIDEO_MAX_DURATION_MINUTES = 10;
export const VIDEO_MAX_DURATION_MS = VIDEO_MAX_DURATION_MINUTES * 60 * 1000;
/** Maximum size of a video in megabytes, _not_ mebibytes. Backend uses ISO megabytes. */
export const VIDEO_MAX_SIZE_MB = 300;
export const VIDEO_MAX_SIZE = VIDEO_MAX_SIZE_MB * 1000 * 1000; // 300mb

export const VIDEO_UPLOAD_MIME_TYPES = [
	'video/mp4',
	'video/mpeg',
	'video/webm',
	'video/quicktime',
	'image/gif',
] as const;

export type VideoUploadMimeType = (typeof VIDEO_UPLOAD_MIME_TYPES)[number];
