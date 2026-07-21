import type { Did } from '@atcute/lexicons';

const PREFIX = 'agent-labelers';

function key(did: string) {
	return `${PREFIX}:${did}`;
}

export function saveLabelers(did: Did, value: Did[]) {
	try {
		localStorage.setItem(key(did), JSON.stringify(value));
	} catch {
		// Expected in restricted/private modes or quota exhaustion.
	}
}

export function readLabelers(did: Did): Did[] | undefined {
	try {
		const rawData = localStorage.getItem(key(did));
		return rawData ? JSON.parse(rawData) : undefined;
	} catch {
		return undefined;
	}
}
