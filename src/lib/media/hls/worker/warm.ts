import { pickRendition } from '../shared/protocol';
import { createFetcher, type Fetch, type Resource, type ResourceKind } from './network';
import { parseVideoMaster } from './playlist';

type PlaylistKind = Exclude<ResourceKind, 'subtitle'>;

const warmFetch = createFetcher({ onBytes: () => {}, onRetry: () => {} });
const unaborted = new AbortController().signal;

// join in-flight warm requests to avoid duplicate fetches.
const warming = new Map<string, Promise<Resource>>();

const warmRequest = (kind: PlaylistKind, url: string) => {
	const request = warmFetch(kind, url, unaborted);

	warming.set(url, request);
	request.finally(() => warming.delete(url)).catch(() => {});
	return request;
};

/**
 * fetches a playlist or reuses its in-flight warm request.
 *
 * @param fetch fallback fetcher when no warm request exists or it fails
 * @param kind playlist kind
 * @param url playlist URL
 * @param signal cancels the fetch; does not cancel a joined warm request
 * @returns the playlist resource
 */
export const fetchWarmed = (fetch: Fetch, kind: PlaylistKind, url: string, signal: AbortSignal) => {
	return warming.get(url)?.catch(() => fetch(kind, url, signal)) ?? fetch(kind, url, signal);
};

/**
 * prefetches the master playlist and its preferred rendition's media playlist.
 *
 * @param playlist master playlist URL
 * @throws when a playlist cannot be fetched or parsed
 */
export const warmPlaylist = async (playlist: string) => {
	// the worker cannot check MediaSource codec support.
	const candidates = parseVideoMaster(await warmRequest('master', playlist));
	if (candidates.length > 0) {
		await warmRequest('media', pickRendition(candidates).url);
	}
};
