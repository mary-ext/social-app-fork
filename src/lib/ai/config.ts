import type { AiEndpoint } from '#/lib/lexicons';

export const OPENROUTER_PROVIDER_ID = 'openrouter';

export const OPENROUTER_PROVIDER_NAME = 'OpenRouter';

export type AiProviderConfig = {
	apiKey?: string;
	/** catalog snapshot used for requests. */
	endpoints: AiEndpoint[];
	modelsDevId?: string;
	name: string;
};

/** configured providers keyed by their device-local id. */
export type AiProviderConfigs = Record<string, AiProviderConfig>;

export type AiModelSelection = {
	/** provider-scoped endpoint id. */
	endpoint: string;
	model: string;
	/** catalog display name. */
	name: string;
	/** device-local provider id. */
	provider: string;
	/** whether requests may include temperature. */
	supportsTemperature: boolean;
};

export type AiRoute = {
	apiKey: string | undefined;
	endpoint: AiEndpoint;
	model: string;
	providerName: string;
	supportsTemperature: boolean;
};
