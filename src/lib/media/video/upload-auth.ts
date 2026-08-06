import { type Client, ok } from '@atcute/client';
import type { Did, Nsid } from '@atcute/lexicons';

import { UploadLimitError } from '#/lib/media/video/errors';

import { VIDEO_PROXY_DID } from '#/env';
import { m } from '#/paraglide/messages';

import { createVideoClient } from './client';

/** the `did:web` audience naming the service behind a URL, or null when the URL has no host. */
function serviceAuthAudience(url: string | URL): Did | null {
	let hostname;
	try {
		hostname = new URL(url).hostname;
	} catch {
		return null;
	}
	return `did:web:${hostname}`;
}

/**
 * mints a short-lived service-auth token on the user's PDS.
 *
 * @param pds signed-in PDS client
 * @param dispatchUrl resolved PDS URL, used to derive a fallback audience when `aud` is omitted
 * @param aud DID the token should be scoped to (defaults to the user's PDS)
 * @param lxm lexicon method the token authorizes
 * @param exp optional unix timestamp (seconds) at which the token expires
 * @returns bearer token string
 */
export async function getServiceAuthToken({
	pds,
	dispatchUrl,
	aud,
	lxm,
	exp,
}: {
	pds: Client;
	dispatchUrl: string;
	aud?: Did;
	lxm: Nsid;
	exp?: number;
}) {
	const pdsAud = serviceAuthAudience(dispatchUrl);
	if (!pdsAud) {
		throw new Error('Agent does not have a PDS URL');
	}
	const { token } = await ok(
		pds.get('com.atproto.server.getServiceAuth', {
			params: { aud: aud ?? pdsAud, exp, lxm },
		}),
	);
	return token;
}

/**
 * Checks whether the signed-in user is allowed to upload video right now, throwing `UploadLimitError` if they
 * have exhausted their quota.
 *
 * @param pds the signed-in PDS client (used to mint the service-auth token).
 * @param dispatchUrl the resolved PDS URL.
 */
export async function assertCanUploadVideo({ pds, dispatchUrl }: { pds: Client; dispatchUrl: string }) {
	const token = await getServiceAuthToken({
		pds,
		dispatchUrl,
		lxm: 'app.bsky.video.getUploadLimits',
		aud: VIDEO_PROXY_DID,
	});
	const videoClient = createVideoClient(token);
	const limits = await ok(videoClient.get('app.bsky.video.getUploadLimits')).catch((err) => {
		if (err instanceof Error) {
			throw new UploadLimitError(err.message);
		} else {
			throw err;
		}
	});

	if (!limits.canUpload) {
		if (limits.message) {
			throw new UploadLimitError(limits.message);
		} else {
			throw new UploadLimitError(m['lib.video.uploadLimit']());
		}
	}
}
