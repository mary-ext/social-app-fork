const PREFIX = 'agent-labelers';

function key(did: string) {
	return `${PREFIX}:${did}`;
}

export async function saveLabelers(did: string, value: string[]) {
	try {
		localStorage.setItem(key(did), JSON.stringify(value));
	} catch {
		// Expected in restricted/private modes or quota exhaustion.
	}
}

export async function readLabelers(did: string): Promise<string[] | undefined> {
	try {
		const rawData = localStorage.getItem(key(did));
		return rawData ? JSON.parse(rawData) : undefined;
	} catch {
		return undefined;
	}
}
