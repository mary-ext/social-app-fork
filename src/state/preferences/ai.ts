import type { AiModelSelection, AiProviderConfig, AiProviderConfigs, AiRoute } from '#/lib/ai/config';

import { device, useStorageValue } from '#/storage';

export type AiFeature = 'imageDescription' | 'translation';

const SELECTION_KEYS: Record<AiFeature, 'aiImageDescriptionModel' | 'aiTranslationModel'> = {
	imageDescription: 'aiImageDescriptionModel',
	translation: 'aiTranslationModel',
};

// keep the empty value referentially stable.
const EMPTY: AiProviderConfigs = {};

/** @returns configured AI providers */
export const useAiProviders = (): AiProviderConfigs => {
	return useStorageValue(device, ['aiProviders']) ?? EMPTY;
};

/**
 * @param feature feature to read
 * @returns its saved selection
 */
export const useAiModelSelection = (feature: AiFeature): AiModelSelection | undefined => {
	return useStorageValue(device, [SELECTION_KEYS[feature]]);
};

/**
 * stores a provider configuration.
 *
 * @param id device-local provider id
 * @param config provider configuration
 */
export const setAiProvider = (id: string, config: AiProviderConfig): void => {
	device.set(['aiProviders'], { ...device.get(['aiProviders']), [id]: config });
};

/**
 * updates a provider credential.
 *
 * @param id device-local provider id
 * @param apiKey credential to store
 * @throws when the provider is not configured
 */
export const setAiProviderApiKey = (id: string, apiKey: string): void => {
	const config = device.get(['aiProviders'])?.[id];
	if (config === undefined) {
		throw new Error(`no AI provider configured as ${id}`);
	}

	setAiProvider(id, { ...config, apiKey: apiKey });
};

/**
 * removes a provider and its model selections.
 *
 * @param id device-local provider id
 */
export const removeAiProvider = (id: string): void => {
	const { [id]: removed, ...rest } = device.get(['aiProviders']) ?? EMPTY;
	if (removed === undefined) {
		return;
	}

	device.set(['aiProviders'], rest);

	for (const key of Object.values(SELECTION_KEYS)) {
		if (device.get([key])?.provider === id) {
			device.remove([key]);
		}
	}
};

/**
 * stores a feature's model selection.
 *
 * @param feature feature to configure
 * @param selection selected route, or `undefined` for the hosted model
 */
export const setAiModelSelection = (feature: AiFeature, selection: AiModelSelection | undefined): void => {
	const key = SELECTION_KEYS[feature];
	if (selection === undefined) {
		device.remove([key]);
	} else {
		device.set([key], selection);
	}
};

/**
 * resolves a feature's saved model route.
 *
 * @param feature feature to run
 * @returns a runnable route, or `null`
 */
export const getAiRoute = (feature: AiFeature): AiRoute | null => {
	const selection = device.get([SELECTION_KEYS[feature]]);
	if (selection === undefined) {
		return null;
	}

	const provider = device.get(['aiProviders'])?.[selection.provider];
	if (provider === undefined) {
		return null;
	}

	const endpoint = provider.endpoints.find((entry) => entry.id === selection.endpoint);
	if (endpoint === undefined) {
		return null;
	}

	if (endpoint.auth !== undefined && provider.apiKey === undefined) {
		return null;
	}

	return {
		apiKey: provider.apiKey,
		endpoint: endpoint,
		model: selection.model,
		providerName: provider.name,
		supportsTemperature: selection.supportsTemperature,
	};
};
