import { ClientResponseError } from '@atcute/client';
import { t } from '@lingui/core/macro';

/**
 * coerces a thrown value into a string suitable for substring matching. plain objects have no useful string
 * form (String() would yield '[object Object]'), so use Error's own toString() (which keeps the name — e.g.
 * "AbortError" — that {@link isNetworkError} matches on) for Error instances, pass strings through, and
 * JSON-serialize the rest. JSON.stringify can return undefined (for undefined / functions / symbols) or throw
 * (circular refs, BigInt), so guard both.
 *
 * @param error the thrown value to stringify
 * @returns a best-effort string representation, never empty-by-accident
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

export function cleanError(error: unknown): string {
	if (!error) {
		return '';
	}
	const str = errorToString(error);
	if (isNetworkError(str)) {
		return t`Unable to connect. Please check your internet connection and try again.`;
	}
	if (
		str.includes('Upstream Failure') ||
		str.includes('NotEnoughResources') ||
		str.includes('pipethrough network error')
	) {
		return t`The server appears to be experiencing issues. Please try again in a few moments.`;
	}
	if (str.includes('Bad token scope') || str.includes('Bad token method')) {
		return t`This feature is not available while using an App Password. Please sign in with your main password.`;
	}
	if (str.includes('Account has been suspended')) {
		return t`Account has been suspended`;
	}
	if (str.includes('Account is deactivated')) {
		return t`Account is deactivated`;
	}
	if (str.includes('Profile not found')) {
		return t`Profile not found`;
	}
	if (str.includes('Unable to resolve handle')) {
		return t`Unable to resolve handle`;
	}
	if (str.startsWith('Error: ')) {
		return str.slice('Error: '.length);
	}
	return str;
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

export function isErrorMaybeAppPasswordPermissions(e: unknown) {
	if (e instanceof ClientResponseError && e.error === 'TokenInvalid') {
		return true;
	}
	const str = String(e);
	return str.includes('Bad token scope') || str.includes('Bad token method');
}

/**
 * Intended to capture "User cancelled" or "Crop cancelled" errors that we often get from expo modules such
 * local image crop tool
 *
 * The exact name has changed in the past so let's just see if the string contains "cancel"
 */
export function isCancelledError(e: unknown) {
	const str = String(e).toLowerCase();
	return str.includes('cancel');
}
