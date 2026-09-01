import * as ComAtprotoRepoStrongRef from '@atcute/atproto/types/repo/strongRef';
import * as AppBskyEmbedExternal from '@atcute/bluesky/types/app/embed/external';
// oxlint-disable-next-line import/no-empty-named-blocks, unicorn/require-module-specifiers -- the empty specifier list is the point: this pulls in atcute's ambient declarations
import type {} from '@atcute/lexicons/ambient';
import * as v from '@atcute/lexicons/validations';

/**
 * resolves opengraph/twitter metadata for an external URL. when present, the returned `image` is an
 * origin-relative path to {@link getLinkImage}. for a standard.site link advertising Atmosphere records,
 * hydrates and returns the `associatedRefs` and enhanced `view`.
 */
export const extractLinkMeta = v.query('internal.app.extractLinkMeta', {
	params: v.object({
		url: v.string(),
	}),
	output: {
		type: 'lex',
		schema: v.object({
			associatedRefs: v.optional(v.array(ComAtprotoRepoStrongRef.mainSchema)),
			description: v.optional(v.string()),
			image: v.optional(v.string()),
			title: v.optional(v.string()),
			url: v.optional(v.string()),
			view: v.optional(AppBskyEmbedExternal.viewSchema),
		}),
	},
});

/**
 * hard ceiling on the inline image payload. `compressAltTextImage` targets roughly a quarter of this, so the
 * cap only ever catches a caller that isn't using it.
 */
const MAX_IMAGE_BYTES = 4_000_000;

/** how many completed rounds a single conversation may replay before the caller has to start over. */
const MAX_ROUNDS = 8;

/** image encodings the endpoint will forward to the model. */
export const ALT_TEXT_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

/**
 * a question the model asked, paired with the user's reply. `answer` is absent while the question is still on
 * screen unanswered — pairing them means an answer can never reference a question that was never asked.
 */
const altTextQuestion = v.object({
	answer: v.optional(v.string()),
	question: v.string(),
});

/**
 * one completed exchange: what the model drafted, and what the user told it in reply — by answering, by
 * rewriting the draft, or both.
 */
const altTextRound = v.object({
	/**
	 * whatever the user volunteered beyond the questions asked, absent when they left the free-form field
	 * blank. it is always on offer, so a round can carry it even when the model asked nothing.
	 */
	additionalContext: v.optional(v.string()),
	draft: v.string(),
	/**
	 * the user's own rewrite of `draft`, absent when they left it as generated. senders should omit it rather
	 * than repeat `draft`; a copy that matches is treated as no edit at all.
	 */
	edited: v.optional(v.string()),
	questions: v.array(altTextQuestion),
});

/** a draft and the questions that would sharpen it; also the shape the model itself is asked to emit. */
export const altTextDraftSchema = v.object({
	draft: v.string(),
	/** what the model still can't determine from the image alone; empty once it has nothing left to ask. */
	questions: v.array(v.string()),
});

/**
 * drafts alt text for an image, optionally refining an earlier draft with the user's answers to the questions
 * it raised. the image is sent inline on every round; `rounds` carries the conversation so far, so the
 * endpoint holds no state between calls.
 */
export const generateAltText = v.procedure('internal.app.generateAltText', {
	params: null,
	input: {
		type: 'lex',
		schema: v.object({
			/** the post the image is being attached to, so the model can anchor names and places it can't see. */
			context: v.optional(
				v.object({
					/** alt text already written for the other images in the same post. */
					siblingAlts: v.optional(v.array(v.string())),
					text: v.optional(v.string()),
				}),
			),
			image: v.object({
				data: v.constrain(v.bytes(), [v.bytesSize(1, MAX_IMAGE_BYTES)]),
				mimeType: v.literalEnum(ALT_TEXT_MIME_TYPES),
			}),
			rounds: v.constrain(v.array(altTextRound), [v.arrayLength(0, MAX_ROUNDS)]),
		}),
	},
	output: {
		type: 'lex',
		schema: altTextDraftSchema,
	},
});

/**
 * mints a short-lived, DPoP-bound client assertion (RFC 7523) for our confidential OAuth client, signed with
 * the client's private key.
 */
export const getClientAssertion = v.procedure('internal.app.getClientAssertion', {
	params: null,
	input: {
		type: 'lex',
		schema: v.object({
			aud: v.string(),
		}),
	},
	output: {
		type: 'lex',
		schema: v.object({
			client_assertion: v.string(),
		}),
	},
});

/**
 * Serves a link thumbnail previously fetched and cached by {@link extractLinkMeta}. The `k` parameter
 * identifies a cache entry; this endpoint never fetches from the network.
 */
export const getLinkImage = v.query('internal.app.getLinkImage', {
	params: v.object({
		k: v.string(),
	}),
	output: {
		type: 'blob',
		encoding: ['image/avif', 'image/gif', 'image/jpeg', 'image/png', 'image/webp'],
	},
});

// #region AI catalog

/** supported AI API formats. */
export const AI_WIRE_FORMATS = ['anthropic_messages', 'openai_chat_completions', 'openai_responses'] as const;

export type AiWireFormat = (typeof AI_WIRE_FORMATS)[number];

/** models.dev modality names. */
export const AI_MODALITIES = ['audio', 'image', 'pdf', 'text', 'video'] as const;

export type AiModality = (typeof AI_MODALITIES)[number];

export const AI_TOKEN_LIMIT_FIELDS = ['max_completion_tokens', 'max_tokens'] as const;

export type AiTokenLimitField = (typeof AI_TOKEN_LIMIT_FIELDS)[number];

const aiEndpointAuthSchema = v.object({
	header: v.string(),
	prefix: v.optional(v.string()),
});

const aiEndpointSchema = v.object({
	auth: v.optional(aiEndpointAuthSchema),
	format: v.literalEnum(AI_WIRE_FORMATS),
	/** stable provider-scoped id stored instead of the URL. */
	id: v.string(),
	/** defaults by wire format when absent. */
	tokenLimitField: v.optional(v.literalEnum(AI_TOKEN_LIMIT_FIELDS)),
	url: v.string(),
});

export type AiEndpoint = v.InferOutput<typeof aiEndpointSchema>;

const aiProviderSchema = v.object({
	endpoints: v.array(aiEndpointSchema),
	id: v.string(),
	name: v.string(),
});

export type AiProvider = v.InferOutput<typeof aiProviderSchema>;

/** lists supported providers and their endpoints. */
export const listAiProviders = v.query('internal.app.listAiProviders', {
	params: null,
	output: {
		type: 'lex',
		schema: v.object({
			providers: v.array(aiProviderSchema),
		}),
	},
});

const MAX_AI_PROVIDER_FILTERS = 32;

const aiModelCapabilitiesSchema = v.object({
	inputModalities: v.array(v.literalEnum(AI_MODALITIES)),
	outputModalities: v.array(v.literalEnum(AI_MODALITIES)),
	structuredOutput: v.boolean(),
	temperature: v.boolean(),
});

const aiModelOfferSchema = v.object({
	capabilities: aiModelCapabilitiesSchema,
	deprecated: v.optional(v.boolean()),
	/** endpoint id from {@link listAiProviders}. */
	endpoint: v.string(),
	format: v.literalEnum(AI_WIRE_FORMATS),
	model: v.string(),
	name: v.string(),
	provider: v.string(),
});

export type AiModelOffer = v.InferOutput<typeof aiModelOfferSchema>;

/** lists model routes matching the requested capabilities. */
export const listAiModels = v.query('internal.app.listAiModels', {
	params: v.object({
		formats: v.constrain(v.array(v.literalEnum(AI_WIRE_FORMATS)), [v.arrayLength(1, AI_WIRE_FORMATS.length)]),
		includeDeprecated: v.optional(v.boolean(), false),
		inputModalities: v.optional(v.array(v.literalEnum(AI_MODALITIES)), () => []),
		outputModalities: v.optional(v.array(v.literalEnum(AI_MODALITIES)), () => []),
		providers: v.constrain(v.array(v.string()), [v.arrayLength(1, MAX_AI_PROVIDER_FILTERS)]),
		structuredOutput: v.optional(v.boolean(), false),
	}),
	output: {
		type: 'lex',
		schema: v.object({
			models: v.array(aiModelOfferSchema),
		}),
	},
});

// #endregion

const MAX_TRANSLATION_CHARS = 3000;

export const translationSchema = v.object({
	sourceLanguage: v.string(),
	translation: v.string(),
});

export const translateText = v.procedure('internal.app.translateText', {
	params: null,
	input: {
		type: 'lex',
		schema: v.object({
			targetLanguage: v.string(),
			text: v.constrain(v.string(), [v.stringLength(1, MAX_TRANSLATION_CHARS)]),
		}),
	},
	output: {
		type: 'lex',
		schema: translationSchema,
	},
});

declare module '@atcute/lexicons/ambient' {
	interface XRPCProcedures {
		'internal.app.generateAltText': typeof generateAltText;
		'internal.app.getClientAssertion': typeof getClientAssertion;
		'internal.app.translateText': typeof translateText;
	}

	interface XRPCQueries {
		'internal.app.extractLinkMeta': typeof extractLinkMeta;
		'internal.app.getLinkImage': typeof getLinkImage;
		'internal.app.listAiModels': typeof listAiModels;
		'internal.app.listAiProviders': typeof listAiProviders;
	}
}
