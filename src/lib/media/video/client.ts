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
 * builds an XRPC client for the video service.
 *
 * @param token service-auth bearer token, or undefined for unauthenticated requests.
 * @returns an XRPC client.
 */
export function createVideoClient(token?: string): Client {
	return new Client({
		handler: (pathname, init) => {
			const headers = new Headers(init.headers);
			if (token) {
				headers.set('Authorization', `Bearer ${token}`);
			}
			return fetch(new URL(pathname, VIDEO_SERVICE), { ...init, headers });
		},
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
