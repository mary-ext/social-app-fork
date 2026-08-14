import type { Client } from '@atcute/client';

import { type QueryClient, useQuery } from '@tanstack/react-query';

import { type ResolvedLink, resolveGif, resolveLink } from '#/lib/api/resolve';
import type { Gif } from '#/lib/gif';

import { STALE } from '#/state/queries/index';
import { getClients } from '#/state/session';

export const RQKEY_LINK_ROOT = 'resolve-link';
export const RQKEY_LINK = (url: string) => [RQKEY_LINK_ROOT, url];

export const RQKEY_GIF_ROOT = 'resolve-gif';
export const RQKEY_GIF = (url: string) => [RQKEY_GIF_ROOT, url];

export function useResolveLinkQuery(url: string) {
	const { appview } = getClients();

	return useQuery({
		queryKey: RQKEY_LINK(url),
		staleTime: STALE.HOURS.ONE,
		queryFn: async ({ signal }) => {
			return await resolveLink(appview, url, signal);
		},
	});
}
export function fetchResolveLinkQuery(queryClient: QueryClient, appview: Client, url: string) {
	return queryClient.fetchQuery({
		staleTime: STALE.HOURS.ONE,
		queryKey: RQKEY_LINK(url),
		queryFn: async ({ signal }) => {
			return await resolveLink(appview, url, signal);
		},
	});
}
export function precacheResolveLinkQuery(queryClient: QueryClient, url: string, resolvedLink: ResolvedLink) {
	queryClient.setQueryData(RQKEY_LINK(url), resolvedLink);
}

export function useResolveGifQuery(gif: Gif) {
	return useQuery({
		queryKey: RQKEY_GIF(gif.url),
		staleTime: STALE.HOURS.ONE,
		queryFn: async ({ signal }) => {
			return await resolveGif(gif, signal);
		},
	});
}
export function fetchResolveGifQuery(queryClient: QueryClient, gif: Gif) {
	return queryClient.fetchQuery({
		staleTime: STALE.HOURS.ONE,
		queryKey: RQKEY_GIF(gif.url),
		queryFn: async ({ signal }) => {
			return await resolveGif(gif, signal);
		},
	});
}
