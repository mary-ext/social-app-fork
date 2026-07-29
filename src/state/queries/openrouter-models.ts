import { useQuery } from '@tanstack/react-query';
import * as v from 'valibot';

import { STALE } from '#/state/queries/index';

const MODELS_URL = 'https://openrouter.ai/api/v1/models';

const openrouterModel = v.object({
	id: v.string(),
	name: v.string(),
	architecture: v.object({
		input_modalities: v.array(v.string()),
	}),
});

export type OpenRouterModel = v.InferOutput<typeof openrouterModel>;

const responseSchema = v.object({
	data: v.array(openrouterModel),
});

type Options = {
	/** A model is listed only when it accepts every one of these input modalities, e.g. `image`. */
	inputModalities: string[];
};

const RQKEY_ROOT = 'openrouter-models';
export const RQKEY = () => [RQKEY_ROOT];

export function useOpenRouterModelsQuery({ inputModalities }: Options) {
	return useQuery({
		queryKey: RQKEY(),
		staleTime: STALE.HOURS.ONE,
		async queryFn(): Promise<OpenRouterModel[]> {
			const response = await fetch(MODELS_URL, { headers: { accept: 'application/json' } });
			if (!response.ok) {
				throw new Error(`openrouter model list returned ${response.status}`);
			}

			const parsed = v.parse(responseSchema, await response.json());

			return parsed.data;
		},
		select(models) {
			return models.filter((model) => {
				return inputModalities.every((modality) => model.architecture.input_modalities.includes(modality));
			});
		},
	});
}
