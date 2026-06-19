import type { AppBskyGraphDefs } from '@atcute/bluesky';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

export function makeProfileLink(info: { did: string }, ...segments: string[]) {
	return [`/profile`, info.did, ...segments].join('/');
}

export function makeCustomFeedLink(did: string, rkey: string, segment?: string) {
	return [`/profile`, did, 'feed', rkey, ...(segment ? [segment] : [])].join('/');
}

export function makeListLink(did: string, rkey: string, ...segments: string[]) {
	return [`/profile`, did, 'lists', rkey, ...segments].join('/');
}

export function makeStarterPackLink(
	starterPackOrName: AppBskyGraphDefs.StarterPackViewBasic | AppBskyGraphDefs.StarterPackView | string,
	rkey?: string,
) {
	if (typeof starterPackOrName === 'string') {
		return `https://bsky.app/start/${starterPackOrName}/${rkey}`;
	} else {
		const uriRkey = parseCanonicalResourceUri(starterPackOrName.uri).rkey;
		return `https://bsky.app/start/${starterPackOrName.creator.did}/${uriRkey}`;
	}
}
