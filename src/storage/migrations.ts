import { OPENROUTER_PROVIDER_ID, OPENROUTER_PROVIDER_NAME } from '#/lib/ai/config';
import type { AiEndpoint } from '#/lib/lexicons';

import type { Device } from '#/storage/schema';
import type { Storage } from '#/storage/storage';

type DeviceStorage = Storage<[], Device>;

// keep in sync with the catalog; migrations cannot depend on the network.
const OPENROUTER_ENDPOINT: AiEndpoint = {
	auth: { header: 'authorization', prefix: 'Bearer ' },
	format: 'openai_chat_completions',
	id: 'openai_chat_completions',
	url: 'https://openrouter.ai/api/v1/chat/completions',
};

/**
 * migrates device storage to the current schema.
 *
 * @param device device storage to migrate
 */
export const migrateDevice = (device: DeviceStorage): void => {
	migrateOpenRouterAi(device);
};

const migrateOpenRouterAi = (device: DeviceStorage): void => {
	const apiKey = device.get(['openrouterApiKey']);
	const imageModel = device.get(['openrouterImageDescriptionModel']);
	const translationModel = device.get(['openrouterTranslationModel']);

	if (apiKey === undefined && imageModel === undefined && translationModel === undefined) {
		return;
	}

	device.set(['aiProviders'], {
		[OPENROUTER_PROVIDER_ID]: {
			apiKey: apiKey,
			endpoints: [OPENROUTER_ENDPOINT],
			modelsDevId: OPENROUTER_PROVIDER_ID,
			name: OPENROUTER_PROVIDER_NAME,
		},
	});

	if (imageModel !== undefined) {
		device.set(['aiImageDescriptionModel'], toSelection(imageModel));
	}
	if (translationModel !== undefined) {
		device.set(['aiTranslationModel'], toSelection(translationModel));
	}

	// remove legacy values only after their replacements are stored.
	device.removeMany(
		[],
		['openrouterApiKey', 'openrouterImageDescriptionModel', 'openrouterTranslationModel'],
	);
};

const toSelection = (model: string) => ({
	endpoint: OPENROUTER_ENDPOINT.id,
	model: model,
	// the catalog name is unavailable during migration.
	name: model,
	provider: OPENROUTER_PROVIDER_ID,
	// preserve the previous OpenRouter request shape.
	supportsTemperature: true,
});
