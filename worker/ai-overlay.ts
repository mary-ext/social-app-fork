import type { AiWireFormat } from '../src/lib/lexicons';

export type AiProviderOverlay = {
	api?: string;
	/** stable ids for model-specific API URLs. */
	endpointIds?: Record<string, string>;
	/** overrides the format inferred from the provider package. */
	format?: AiWireFormat;
};

/** models.dev provider corrections. */
export const PROVIDER_OVERLAYS: Record<string, AiProviderOverlay> = {
	anthropic: {
		api: 'https://api.anthropic.com/v1',
	},
	cerebras: {
		api: 'https://api.cerebras.ai/v1',
		format: 'openai_chat_completions',
	},
	cohere: {
		api: 'https://api.cohere.ai/compatibility/v1',
		format: 'openai_chat_completions',
	},
	deepinfra: {
		api: 'https://api.deepinfra.com/v1/openai',
		format: 'openai_chat_completions',
	},
	freemodel: {
		// four models use a separate OpenAI-compatible endpoint.
		endpointIds: { 'https://api.freemodel.dev/v1': 'openai_chat_completions' },
	},
	google: {
		api: 'https://generativelanguage.googleapis.com/v1beta/openai',
		format: 'openai_chat_completions',
	},
	groq: {
		api: 'https://api.groq.com/openai/v1',
		format: 'openai_chat_completions',
	},
	mistral: {
		api: 'https://api.mistral.ai/v1',
		format: 'openai_chat_completions',
	},
	openai: {
		api: 'https://api.openai.com/v1',
	},
	perplexity: {
		api: 'https://api.perplexity.ai',
		format: 'openai_chat_completions',
	},
	togetherai: {
		api: 'https://api.together.xyz/v1',
		format: 'openai_chat_completions',
	},
	venice: {
		api: 'https://api.venice.ai/api/v1',
		format: 'openai_chat_completions',
	},
	vercel: {
		api: 'https://ai-gateway.vercel.sh/v1',
		format: 'openai_chat_completions',
	},
	xai: {
		api: 'https://api.x.ai/v1',
		format: 'openai_chat_completions',
	},
};
