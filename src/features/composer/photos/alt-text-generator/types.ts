import type * as v from '@atcute/lexicons/validations';

import type { altTextDraftSchema, generateAltText } from '#/lib/lexicons/internal-app';

type Input = v.InferOutput<(typeof generateAltText)['input']['schema']>;

/** The post the image is being attached to, giving the model something to anchor what it can't see to. */
export type AltTextContext = NonNullable<Input['context']>;

/** What one round produces. */
export type AltTextDraft = v.InferOutput<typeof altTextDraftSchema>;

/** One completed exchange: what the model drafted, and what the user told it in reply. */
export type AltTextRound = Input['rounds'][number];

/** A question the model asked, paired with the user's reply. */
export type AltTextQuestion = AltTextRound['questions'][number];

/** An image encoded for the description endpoint. */
export type AltTextImage = {
	/** Base64, no data URL prefix. */
	data: string;
	mimeType: Input['image']['mimeType'];
};
