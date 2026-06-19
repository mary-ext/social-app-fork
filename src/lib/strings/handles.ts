import { forceLTR } from '#/lib/strings/bidi';

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
