import { ok } from '@atcute/client';
import { toBase64Pad } from '@atcute/multibase';

import { ALT_TEXT_MIME_TYPES } from '#/lib/lexicons';
import { compressAltTextImage } from '#/lib/media/compress-image';

import { getInternalServiceClient } from '#/state/internal-service-client';
import { getAiRoute } from '#/state/preferences/ai';

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

	const route = getAiRoute('imageDescription');
	if (route !== null) {
		const { runAiAltTextRound } = await import('#/lib/ai/completions');

		return await runAiAltTextRound({ input: input, route: route, signal: signal });
	}

	return await ok(
		getInternalServiceClient().post('internal.app.generateAltText', {
			signal: signal,
			input: input,
		}),
	);
};

const isAcceptedType = (type: string): type is AltTextImage['mimeType'] => {
	return ALT_TEXT_MIME_TYPES.some((accepted) => accepted === type);
};
