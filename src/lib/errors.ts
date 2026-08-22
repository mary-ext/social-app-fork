import { ClientResponseError } from '@atcute/client';

import { m } from '#/paraglide/messages';

/**
 * extracts an error's message, falling back to stringifying non-`Error` throws.
 *
 * prefer this over {@link errorToString} for anything a person reads: it omits the `Error: ` prefix.
 *
 * @param error the thrown value to describe
 * @returns the message, or a best-effort string representation
 */
export function errorMessage(error: unknown): string {
	return error instanceof Error ? error.message : String(error);
}

/**
 * coerces a thrown value into a string suitable for substring matching.
 *
 * @param error the thrown value to stringify
 * @returns a best-effort string representation
 */
export function errorToString(error: unknown): string {
	if (error instanceof Error) {
		return error.toString();
	}
	if (typeof error === 'string') {
		return error;
	}
	if (
		typeof error === 'bigint' ||
		typeof error === 'boolean' ||
		typeof error === 'number' ||
		typeof error === 'symbol'
	) {
		return String(error);
	}
	try {
		return JSON.stringify(error) ?? '';
	} catch {
		return '';
	}
}

/**
 * the localized rewording for a recognized failure, or undefined when the raw text is the best we have.
 *
 * @param str the stringified error
 * @returns the localized message, or undefined
 */
function localizeError(str: string): string | undefined {
	if (isNetworkError(str)) {
		return m['lib.error.connectionFailed']();
	}
	if (
		str.includes('Upstream Failure') ||
		str.includes('NotEnoughResources') ||
		str.includes('pipethrough network error')
	) {
		return m['lib.error.serverIssues']();
	}
	if (str.includes('Rate Limit Exceeded')) {
		return m['lib.error.rateLimit']();
	}
	if (str.includes('Account has been suspended')) {
		return m['lib.account.error.suspended']();
	}
	if (str.includes('Account is deactivated')) {
		return m['lib.account.error.deactivated']();
	}
	if (str.includes('Profile not found')) {
		return m['lib.profile.notFound']();
	}
	if (str.includes('Unable to resolve handle')) {
		return m['lib.error.handleResolveFailed']();
	}
	return undefined;
}

/**
 * splits an error into the text it carries and the localized rewording we show in its place.
 *
 * callers that only render one string want {@link cleanError}; this exists for the ones that fall back to
 * their own copy when we have no rewording.
 *
 * @param error the thrown value to describe
 * @returns `raw` is the error's own text (sans `Error: ` prefix), `clean` the rewording when one applies
 */
export function describeError(error: unknown): {
	raw: string | undefined;
	clean: string | undefined;
} {
	if (!error) {
		return { raw: undefined, clean: undefined };
	}
	const str = errorToString(error);
	return {
		raw: str.startsWith('Error: ') ? str.slice('Error: '.length) : str,
		clean: localizeError(str),
	};
}

/**
 * the message to show a person for a thrown value: a localized rewording when we recognize the failure,
 * otherwise the error's own text.
 *
 * @param error the thrown value to describe
 * @returns the message, or an empty string when there is no error
 */
export function cleanError(error: unknown): string {
	const { raw, clean } = describeError(error);
	return clean ?? raw ?? '';
}

const NETWORK_ERRORS = [
	'Abort',
	'Network request failed',
	'Failed to fetch',
	'Load failed',
	'Upstream service unreachable',
	'NetworkError when attempting to fetch resource',
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

// rate limits, timeouts, and transient upstream failures — the request stands a chance next time. anything
// else (a 400 on a malformed query, a 404 on a missing record) fails again identically.
const RETRYABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504, 522, 524]);

/**
 * checks whether an HTTP status is one a retry could clear.
 *
 * most callers hold the error rather than a bare status and want {@link shouldRetryError}; this exists for the
 * ones that recover a status from somewhere else, like a relayed upstream failure.
 *
 * @param status the HTTP status code to check
 * @returns true if a request that failed this way is worth retrying
 */
export function isRetryableHttpStatus(status: number) {
	return RETRYABLE_STATUSES.has(status);
}

/**
 * checks whether an error is likely to clear on its own, so callers can decide whether to suggest retrying.
 *
 * network failures are not covered here — pair this with {@link isNetworkError} when both should count.
 *
 * @param e the thrown value to check
 * @returns true if the request is worth retrying
 */
export function shouldRetryError(e: unknown) {
	return e instanceof ClientResponseError && isRetryableHttpStatus(e.status);
}

/**
 * checks for declared or legacy missing-record errors. legacy messages may also indicate an invalid record
 * reference.
 *
 * @param e thrown value
 * @returns whether the record was not found
 */
export function isRecordNotFoundError(e: unknown) {
	if (e instanceof ClientResponseError && e.error === 'RecordNotFound') {
		return true;
	}
	// older PDS versions report the miss only in the message.
	return e instanceof Error && e.message.includes('Could not locate record');
}

/**
 * checks if an error was raised by aborting an in-flight action.
 *
 * matches on `name` because aborts arrive from several sources — `AbortController`, the toggle mutation
 * queue, `#/lib/utils/abort-error` — with no common class.
 *
 * @param e the thrown value to check
 * @returns true if the value is an abort error
 */
export function isAbortError(e: unknown) {
	return e instanceof Error && e.name === 'AbortError';
}

/**
 * checks if an error was caused by the user cancelling an action.
 *
 * @param error the error to check
 * @returns true if the error message indicates cancellation
 */
export function isCancelledError(e: unknown) {
	const str = String(e).toLowerCase();
	return str.includes('cancel');
}
