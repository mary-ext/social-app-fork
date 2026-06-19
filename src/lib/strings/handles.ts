// Regex from the go implementation
// https://github.com/bluesky-social/indigo/blob/main/atproto/syntax/handle.go#L10
import { forceLTR } from '#/lib/strings/bidi';

export const MAX_SERVICE_HANDLE_LENGTH = 18;

export function createFullHandle(name: string, domain: string): string {
	name = (name || '').replace(/[.]+$/, '');
	domain = (domain || '').replace(/^[.]+/, '');
	return `${name}.${domain}`;
}

export function isInvalidHandle(handle: string): boolean {
	return handle === 'handle.invalid';
}

export function sanitizeHandle(handle: string, prefix = '', forceLeftToRight = true): string {
	const lowercasedWithPrefix = `${prefix}${handle.toLocaleLowerCase()}`;
	return isInvalidHandle(handle)
		? '⚠Invalid Handle'
		: forceLeftToRight
			? forceLTR(lowercasedWithPrefix)
			: lowercasedWithPrefix;
}

export interface IsValidHandle {
	handleChars: boolean;
	hyphenStartOrEnd: boolean;
	frontLengthNotTooShort: boolean;
	frontLengthNotTooLong: boolean;
	totalLength: boolean;
	overall: boolean;
}
