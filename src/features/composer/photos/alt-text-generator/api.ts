import { type Client, ok } from '@atcute/client';
import { toBase64Pad } from '@atcute/multibase';

import { internalClient } from '#/lib/api/internal-client';
import { ALT_TEXT_MIME_TYPES } from '#/lib/lexicons';
import { compressAltTextImage } from '#/lib/media/compress-image';

import { getImageDescriptionConfig } from '#/state/preferences/openrouter';
import { getClients } from '#/state/session';

import { INTERNAL_PROXY_AUDIENCE } from '#/env';

import type { AltTextContext, AltTextDraft, AltTextImage, AltTextRound } from './types';

export const prepareAltTextImage = async (blob: Blob): Promise<AltTextImage> => {
	const compressed = await compressAltTextImage(blob);
	const mimeType = compressed.blob.type;

	// the compressor passes an already-fitting source straight through, so the type it comes back with is the
	// source's, not the one it would have encoded to
	if (!isAcceptedType(mimeType)) {
		throw new Error(`unexpected encoding ${mimeType}`);
	}

	return { data: toBase64Pad(new Uint8Array(await compressed.blob.arrayBuffer())), mimeType };
};

type Options = {
	context: AltTextContext;
	image: AltTextImage;
	rounds: AltTextRound[];
	signal: AbortSignal;
};

export const generateAltText = async ({ context, image, rounds, signal }: Options): Promise<AltTextDraft> => {
	const input = {
		context: context,
		image: { data: { $bytes: image.data }, mimeType: image.mimeType },
		rounds: rounds,
	};

	const openrouter = getImageDescriptionConfig();
	if (openrouter !== null) {
		const { runOpenRouterAltTextRound } = await import('#/lib/ai/openrouter');

		return await runOpenRouterAltTextRound({ ...openrouter, input: input, signal: signal });
	}

	return await ok(
		createDescriptionClient().post('internal.app.generateAltText', {
			signal: signal,
			input: input,
		}),
	);
};

const createDescriptionClient = (): Client => {
	if (import.meta.env.DEV) {
		return internalClient;
	}

	const { pds } = getClients();
	if (pds === null) {
		throw new Error('cannot generate alt text while logged out');
	}

	return pds.clone({ proxy: INTERNAL_PROXY_AUDIENCE });
};

const isAcceptedType = (type: string): type is AltTextImage['mimeType'] => {
	return ALT_TEXT_MIME_TYPES.some((accepted) => accepted === type);
};
