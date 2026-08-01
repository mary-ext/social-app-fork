import { useQuery } from '@tanstack/react-query';
import * as v from 'valibot';

import { STALE } from '#/state/queries/index';

const MODELS_URL = 'https://openrouter.ai/api/v1/models';

const openrouterModel = v.object({
	id: v.string(),
	name: v.string(),
	architecture: v.object({
		input_modalities: v.array(v.string()),
		output_modalities: v.array(v.string()),
	}),
});

export type OpenRouterModel = v.InferOutput<typeof openrouterModel>;

const responseSchema = v.object({
	data: v.array(openrouterModel),
});

type Modality = 'audio' | 'image' | 'text' | 'video';

type ParsedModelId = {
	author: string;
	alias: boolean;
	rest: string;
};

const parseModelId = (id: string): ParsedModelId => {
	const alias = id.startsWith('~');
	const slash = id.indexOf('/');
	if (slash === -1) {
		return { author: id.slice(alias ? 1 : 0), alias, rest: '' };
	}

	return { author: id.slice(alias ? 1 : 0, slash), alias, rest: id.slice(slash + 1) };
};

const compareStrings = (a: string, b: string) => {
	return a < b ? -1 : a > b ? 1 : 0;
};

const compareModelIds = (a: string, b: string) => {
	const left = parseModelId(a);
	const right = parseModelId(b);

	if (left.author !== right.author) {
		if (left.author === 'openrouter') {
			return -1;
		}
		if (right.author === 'openrouter') {
			return 1;
		}

		return compareStrings(left.author, right.author);
	}

	if (left.alias !== right.alias) {
		return left.alias ? -1 : 1;
	}

	return compareStrings(left.rest, right.rest);
};

type Options = {
	/** A model is listed only when it accepts every one of these input modalities, e.g. `image`. */
	inputModalities: Modality[];
	/** A model is listed only when it emits every one of these output modalities, e.g. `text`. */
	outputModalities: Modality[];
};

const RQKEY_ROOT = 'openrouter-models';
export const RQKEY = () => [RQKEY_ROOT];

export function useOpenRouterModelsQuery({ inputModalities, outputModalities }: Options) {
	return useQuery({
		queryKey: RQKEY(),
		staleTime: STALE.HOURS.ONE,
		async queryFn(): Promise<OpenRouterModel[]> {
			const response = await fetch(MODELS_URL, { headers: { accept: 'application/json' } });
			if (!response.ok) {
				throw new Error(`openrouter model list returned ${response.status}`);
			}

			const parsed = v.parse(responseSchema, await response.json());

			// oxlint-disable-next-line unicorn/no-array-sort
			return parsed.data.sort((a, b) => compareModelIds(a.id, b.id));
		},
		select(models) {
			return models.filter((model) => {
				return (
					inputModalities.every((modality) => model.architecture.input_modalities.includes(modality)) &&
					outputModalities.every((modality) => model.architecture.output_modalities.includes(modality))
				);
			});
		},
	});
}
