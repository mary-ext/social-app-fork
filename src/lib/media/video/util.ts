import { Client } from '@atcute/client';

import { type SupportedMimeTypes, VIDEO_SERVICE } from '#/lib/constants';

export const createVideoEndpointUrl = (route: string, params?: Record<string, string>) => {
	const url = new URL(VIDEO_SERVICE);
	url.pathname = route;
	if (params) {
		for (const key in params) {
			url.searchParams.set(key, params[key]!);
		}
	}
	return url.href;
};

/**
 * Builds an XRPC client that talks directly to the video service, authenticating with a short-lived
 * service-auth token. The token is minted upstream via `com.atproto.server.getServiceAuth` on the user's
 * PDS.
 *
 * @param token the service-auth bearer token.
 * @returns a `Client` rooted at `VIDEO_SERVICE` that carries the bearer credential on every request.
 */
export function createVideoClient(token: string): Client {
	return new Client({
		handler: (pathname, init) =>
			fetch(new URL(pathname, VIDEO_SERVICE), {
				...init,
				headers: { ...init.headers, Authorization: `Bearer ${token}` },
			}),
	});
}

export function mimeToExt(mimeType: SupportedMimeTypes | (string & {})) {
	switch (mimeType) {
		case 'video/mp4':
			return 'mp4';
		case 'video/webm':
			return 'webm';
		case 'video/mpeg':
			return 'mpeg';
		case 'video/quicktime':
			return 'mov';
		case 'image/gif':
			return 'gif';
		default:
			throw new Error(`Unsupported mime type: ${mimeType}`);
	}
}

export function extToMime(ext: string) {
	switch (ext.toLowerCase()) {
		case 'mp4':
			return 'video/mp4';
		case 'webm':
			return 'video/webm';
		case 'mpeg':
			return 'video/mpeg';
		case 'mov':
			return 'video/quicktime';
		case 'gif':
			return 'image/gif';
		default:
			throw new Error(`Unsupported file extension: ${ext}`);
	}
}
