import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { describeAiFailure } from '#/lib/ai/error';
import type { Translation, TranslationInput } from '#/lib/ai/translate';
import { getPostRecord } from '#/lib/api/record-casts';

import { getInternalServiceClient } from '#/state/internal-service-client';
import { getAiRoute } from '#/state/preferences/ai';
import { usePrimaryLanguage } from '#/state/preferences/languages';
import { GCTIME, STALE } from '#/state/queries/index';

import { m } from '#/paraglide/messages';

// duplicated to keep the prompt module out of the thread bundle.
const UNDETERMINED_LANGUAGE = 'und';

type TranslationState =
	| { status: 'error'; message: string }
	| { status: 'idle' }
	| { status: 'loading' }
	| {
			status: 'success';
			sourceLanguage: string | undefined;
			translation: string;
	  };

type PostTranslation = {
	state: TranslationState;
	targetLanguage: string;
	translate: () => void;
};

const RQKEY_ROOT = 'post-translation';

/**
 * provides lazy translation state for a post.
 *
 * @param post the post to translate
 * @returns the translation state and trigger
 */
export const usePostTranslation = (post: AppBskyFeedDefs.PostView): PostTranslation => {
	const queryClient = useQueryClient();
	const targetLanguage = usePrimaryLanguage();

	const options = {
		queryKey: [RQKEY_ROOT, post.uri, targetLanguage],
		queryFn: ({ signal }: { signal: AbortSignal }) => {
			return translate({ signal, targetLanguage: targetLanguage, text: getPostRecord(post).text });
		},
		gcTime: GCTIME.MINUTES.FIVE,
		// post records are immutable.
		staleTime: STALE.INFINITY,
	};

	const { data, error, fetchStatus } = useQuery({ ...options, enabled: false });

	let state: TranslationState;
	if (fetchStatus === 'fetching') {
		state = { status: 'loading' };
	} else if (data !== undefined) {
		state = {
			status: 'success',
			sourceLanguage: data.sourceLanguage === UNDETERMINED_LANGUAGE ? undefined : data.sourceLanguage,
			translation: data.translation,
		};
	} else if (error !== null) {
		state = { status: 'error', message: describeFailure(error) };
	} else {
		state = { status: 'idle' };
	}

	return {
		state,
		targetLanguage,
		translate: () => {
			// query state reports failures.
			void queryClient.fetchQuery(options).catch(() => {});
		},
	};
};

const translate = async ({
	signal,
	...input
}: TranslationInput & { signal: AbortSignal }): Promise<Translation> => {
	const route = getAiRoute('translation');
	if (route !== null) {
		const { runAiTranslation } = await import('#/lib/ai/completions');

		return await runAiTranslation({ input: input, route: route, signal: signal });
	}

	return await ok(
		getInternalServiceClient().post('internal.app.translateText', {
			signal: signal,
			input: input,
		}),
	);
};

const describeFailure = (error: unknown): string =>
	describeAiFailure({
		error,
		rateLimited: m['components.post.translate.error.rateLimited'],
		unavailable: m['components.post.translate.error.unavailable'],
	});
