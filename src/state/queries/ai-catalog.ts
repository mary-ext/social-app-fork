import { ok } from '@atcute/client';

import { unique } from '@mary/array-fns';

import { useQuery } from '@tanstack/react-query';

import { internalClient } from '#/lib/api/internal-client';
import type { AiModality, AiModelOffer, AiProvider } from '#/lib/lexicons';

import { STALE } from '#/state/queries/index';

const PROVIDERS_RQKEY_ROOT = 'ai-providers';
const MODELS_RQKEY_ROOT = 'ai-models';

/**
 * queries the AI provider catalog.
 *
 * @returns the provider catalog query
 */
export const useAiProvidersQuery = () => {
	return useQuery({
		queryKey: [PROVIDERS_RQKEY_ROOT],
		staleTime: STALE.HOURS.ONE,
		async queryFn({ signal }): Promise<AiProvider[]> {
			const { providers } = await ok(internalClient.get('internal.app.listAiProviders', { signal: signal }));
			return providers;
		},
	});
};

type ModelsOptions = {
	providers: string[];
	inputModalities: AiModality[];
	outputModalities: AiModality[];
};

/**
 * queries compatible model routes with structured output.
 *
 * @param options provider and modality filters
 * @returns the model catalog query
 */
export const useAiModelsQuery = ({ inputModalities, outputModalities, providers }: ModelsOptions) => {
	// normalize the provider set for cache keys.
	const sorted = unique(providers).toSorted();

	return useQuery({
		enabled: sorted.length > 0,
		queryKey: [MODELS_RQKEY_ROOT, sorted, inputModalities, outputModalities],
		staleTime: STALE.HOURS.ONE,
		async queryFn({ signal }): Promise<AiModelOffer[]> {
			const { models } = await ok(
				internalClient.get('internal.app.listAiModels', {
					signal: signal,
					params: {
						inputModalities: inputModalities,
						outputModalities: outputModalities,
						providers: sorted,
						structuredOutput: true,
					},
				}),
			);
			return models;
		},
	});
};
