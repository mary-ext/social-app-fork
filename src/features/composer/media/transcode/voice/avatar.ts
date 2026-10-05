import { Client, simpleFetchHandler } from '@atcute/client';
import type { Did } from '@atcute/lexicons';

import { getRecord, syncBlobUrl } from '#/lib/api/records';

import { AVATAR_RADIUS } from './spec';

// workers can't decode SVG; redraw default-avatar-user.svg on canvas.
const DEFAULT_AVATAR_VIEWBOX = 24;
const DEFAULT_AVATAR_BACKGROUND = '#0070ff';
const DEFAULT_AVATAR_BODY =
	'M 12.058 22.784 C 9.422 22.784 7.007 21.836 5.137 20.262 C 5.667 17.988 8.534 16.25 11.99 16.25 C 15.494 16.25 18.391 18.036 18.864 20.357 C 17.01 21.874 14.64 22.784 12.058 22.784 Z';

type AvatarOptions = {
	did: Did;
	pdsUrl: string;
};

// PDS profile and blob reads need no auth and allow canvas-safe CORS access.
const fetchAvatarBlob = async ({ did, pdsUrl }: AvatarOptions): Promise<Blob | undefined> => {
	const pds = new Client({ handler: simpleFetchHandler({ service: pdsUrl }) });
	const { value } = await getRecord(pds, {
		repo: did,
		collection: 'app.bsky.actor.profile',
		rkey: 'self',
	});
	if (!value.avatar) {
		return undefined;
	}

	const cid = 'ref' in value.avatar ? value.avatar.ref.$link : value.avatar.cid;
	const response = await fetch(syncBlobUrl({ pdsUrl, did, cid }));
	if (!response.ok) {
		throw new Error(`getBlob responded ${response.status}`);
	}
	return response.blob();
};

const drawDefaultAvatar = (): ImageBitmap => {
	const size = AVATAR_RADIUS * 2;
	const canvas = new OffscreenCanvas(size, size);
	const context = canvas.getContext('2d');
	if (!context) {
		throw new Error(`couldn't acquire a 2D context for the default avatar`);
	}

	const scale = size / DEFAULT_AVATAR_VIEWBOX;
	context.scale(scale, scale);

	context.fillStyle = DEFAULT_AVATAR_BACKGROUND;
	context.fillRect(0, 0, DEFAULT_AVATAR_VIEWBOX, DEFAULT_AVATAR_VIEWBOX);

	context.fillStyle = '#fff';
	context.beginPath();
	context.arc(12, 9.5, 3.5, 0, Math.PI * 2);
	context.fill();
	// oxlint-disable-next-line unicorn/no-array-fill-with-reference-type -- a canvas fill, not Array#fill
	context.fill(new Path2D(DEFAULT_AVATAR_BODY));

	return canvas.transferToImageBitmap();
};

/**
 * loads the account's avatar, using the default if absent or unreadable.
 *
 * @param options account DID and its PDS URL
 * @returns a canvas-safe avatar bitmap
 * @throws if the default avatar cannot be drawn
 */
export const loadVoiceClipAvatar = async (options: AvatarOptions): Promise<ImageBitmap> => {
	try {
		const blob = await fetchAvatarBlob(options);
		if (blob) {
			return await createImageBitmap(blob);
		}
	} catch (err) {
		console.warn('Failed to load avatar for voice clip', err);
	}

	return drawDefaultAvatar();
};
