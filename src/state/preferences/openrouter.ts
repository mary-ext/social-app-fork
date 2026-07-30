import type { OpenRouterConfig } from '#/lib/ai/openrouter';

import { device, useStorageValue } from '#/storage';

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
	if (value === undefined) {
		device.remove(['openrouterImageDescriptionModel']);
	} else {
		device.set(['openrouterImageDescriptionModel'], value);
	}
}

export function getImageDescriptionConfig(): OpenRouterConfig | null {
	const apiKey = device.get(['openrouterApiKey']);
	if (apiKey === undefined) {
		return null;
	}

	const model = device.get(['openrouterImageDescriptionModel']);
	if (model === undefined) {
		return null;
	}

	return { apiKey: apiKey, model: model };
}
