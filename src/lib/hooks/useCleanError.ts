import { useCallback } from 'react';

import { m } from '#/paraglide/messages';

type CleanedError = {
	raw: string | undefined;
	clean: string | undefined;
};

export function useCleanError() {
	return useCallback<(error?: unknown) => CleanedError>((error) => {
		if (!error)
			return {
				raw: undefined,
				clean: undefined,
			};

		let raw =
			error instanceof Error ? error.message : typeof error === 'string' ? error : JSON.stringify(error);

		if (isNetworkError(raw)) {
			return {
				raw,
				clean: m['lib.error.connectionFailed'](),
			};
		}

		if (
			raw.includes('Upstream Failure') ||
			raw.includes('NotEnoughResources') ||
			raw.includes('pipethrough network error')
		) {
			return {
				raw,
				clean: m['lib.error.serverIssues'](),
			};
		}

		if (raw.includes('Bad token scope') || raw.includes('Bad token method')) {
			return {
				raw,
				clean: m['lib.error.appPasswordFeature'](),
			};
		}

		if (raw.includes('Rate Limit Exceeded')) {
			return {
				raw,
				clean: m['lib.error.rateLimit'](),
			};
		}

		if (raw.startsWith('Error: ')) {
			raw = raw.slice('Error: '.length);
		}

		return {
			raw,
			clean: undefined,
		};
	}, []);
}

const NETWORK_ERRORS = [
	'Abort',
	'Network request failed',
	'Failed to fetch',
	'Load failed',
	'Upstream service unreachable',
];

export function isNetworkError(e: unknown) {
	const str = String(e);
	for (const err of NETWORK_ERRORS) {
		if (str.includes(err)) {
			return true;
		}
	}
	return false;
}
