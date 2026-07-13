import type { AnyStarterPackView } from '@atcute/bluesky';
import { parseResourceUri } from '@atcute/lexicons/syntax';

export function parseStarterPackUri(uri?: string): {
	name: string;
	rkey: string;
} | null {
	if (!uri) return null;

	try {
		if (uri.startsWith('at://')) {
			const atUri = parseResourceUri(uri);
			if (atUri.collection !== 'app.bsky.graph.starterpack') return null;
			if (atUri.rkey) {
				return {
					name: atUri.repo,
					rkey: atUri.rkey,
				};
			}
			return null;
		} else {
			const url = new URL(uri);
			const parts = url.pathname.split('/');
			const [__, path, name, rkey] = parts;

			if (parts.length !== 4) return null;
			if (path !== 'starter-pack' && path !== 'start') return null;
			if (!name || !rkey) return null;
			return {
				name,
				rkey,
			};
		}
	} catch {
		return null;
	}
}

export function httpStarterPackUriToAtUri(httpUri?: string): string | null {
	if (!httpUri) return null;

	const parsed = parseStarterPackUri(httpUri);
	if (!parsed) return null;

	if (httpUri.startsWith('at://')) return httpUri;

	return `at://${parsed.name}/app.bsky.graph.starterpack/${parsed.rkey}`;
}

export function getStarterPackOgCard(didOrStarterPack: AnyStarterPackView | string, rkey?: string) {
	if (typeof didOrStarterPack === 'string') {
		return `https://ogcard.cdn.bsky.app/start/${didOrStarterPack}/${rkey}`;
	} else {
		const rkey = parseResourceUri(didOrStarterPack.uri).rkey;
		return `https://ogcard.cdn.bsky.app/start/${didOrStarterPack.creator.did}/${rkey}`;
	}
}

export function createStarterPackUri({ did, rkey }: { did: string; rkey: string }): string {
	return `at://${did}/app.bsky.graph.starterpack/${rkey}`;
}

export function startUriToStarterPackUri(uri: string) {
	return uri.replace('/start/', '/starter-pack/');
}
