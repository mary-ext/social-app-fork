import type { Client } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { getRecord, syncBlobUrl } from '#/lib/api/records';
import { isAbortError } from '#/lib/errors';

import defaultAvatarUrl from '#/assets/default-avatar-user.svg?url';

import { AVATAR_RADIUS } from './spec';

// the SVG has no intrinsic size; use the card's avatar diameter.
const DEFAULT_AVATAR_SIZE = AVATAR_RADIUS * 2;

type AvatarOptions = {
	did: Did;
	/** client for the account's own PDS */
	pds: Client;
	pdsUrl: string;
	signal: AbortSignal;
};

// fetch from the PDS for canvas-safe CORS access.
const fetchAvatarBlob = async ({ did, pds, pdsUrl, signal }: AvatarOptions): Promise<Blob | undefined> => {
	const { value } = await getRecord(pds, {
		repo: did,
		collection: 'app.bsky.actor.profile',
		rkey: 'self',
		signal,
	});
	if (!value.avatar) {
		return undefined;
	}

	const cid = 'ref' in value.avatar ? value.avatar.ref.$link : value.avatar.cid;
	const response = await fetch(syncBlobUrl({ pdsUrl, did, cid }), { signal });
	if (!response.ok) {
		throw new Error(`getBlob responded ${response.status}`);
	}
	return response.blob();
};

const decodeDefaultAvatar = async (): Promise<ImageBitmap> => {
	const image = new Image();
	image.src = defaultAvatarUrl;
	await image.decode();
	return createImageBitmap(image, { resizeWidth: DEFAULT_AVATAR_SIZE, resizeHeight: DEFAULT_AVATAR_SIZE });
};

/**
 * loads the account's avatar, using the default if absent or unreadable.
 *
 * @param options account DID, its PDS client and URL, and cancellation signal
 * @returns a canvas-safe avatar bitmap
 * @throws the signal's abort reason if `signal` aborts
 * @throws if the default avatar cannot be decoded
 */
export const loadVoiceClipAvatar = async (options: AvatarOptions): Promise<ImageBitmap> => {
	try {
		const blob = await fetchAvatarBlob(options);
		if (blob) {
			return await createImageBitmap(blob);
		}
	} catch (err) {
		if (isAbortError(err)) {
			throw err;
		}
		console.warn('Failed to load avatar for voice clip', err);
	}

	options.signal.throwIfAborted();
	return decodeDefaultAvatar();
};
