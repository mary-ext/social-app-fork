import type { OpenRouterConfig } from '#/lib/ai/openrouter';

import { device, useStorageValue } from '#/storage';

type ModelKey = 'openrouterImageDescriptionModel' | 'openrouterTranslationModel';

export function useOpenRouterApiKey(): string | undefined {
	return useStorageValue(device, ['openrouterApiKey']);
}

export function setOpenRouterApiKey(value: string): void {
	const trimmed = value.trim();
	if (trimmed === '') {
		device.remove(['openrouterApiKey']);
		return;
	}
	device.set(['openrouterApiKey'], trimmed);
}

export function useImageDescriptionModel(): string | undefined {
	return useStorageValue(device, ['openrouterImageDescriptionModel']);
}

export function setImageDescriptionModel(value: string | undefined): void {
	setModel('openrouterImageDescriptionModel', value);
}

/** @returns the configured translation model */
export const useTranslationModel = (): string | undefined => {
	return useStorageValue(device, ['openrouterTranslationModel']);
};

/**
 * sets the translation model.
 *
 * @param value OpenRouter model slug
 */
export const setTranslationModel = (value: string | undefined): void => {
	setModel('openrouterTranslationModel', value);
};

/**
 * returns the image-description OpenRouter configuration.
 *
 * @returns the configuration, or `null` when incomplete
 */
export const getImageDescriptionConfig = (): OpenRouterConfig | null => {
	return getConfig('openrouterImageDescriptionModel');
};

/**
 * returns the translation OpenRouter configuration.
 *
 * @returns the configuration, or `null` when incomplete
 */
export const getTranslationConfig = (): OpenRouterConfig | null => {
	return getConfig('openrouterTranslationModel');
};

const setModel = (key: ModelKey, value: string | undefined): void => {
	if (value === undefined) {
		device.remove([key]);
	} else {
		device.set([key], value);
	}
};

const getConfig = (key: ModelKey): OpenRouterConfig | null => {
	const apiKey = device.get(['openrouterApiKey']);
	if (apiKey === undefined) {
		return null;
	}

	const model = device.get([key]);
	if (model === undefined) {
		return null;
	}

	return { apiKey: apiKey, model: model };
};
