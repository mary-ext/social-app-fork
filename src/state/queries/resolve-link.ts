import type { Client } from '@atcute/client';

import { type QueryClient, useQuery } from '@tanstack/react-query';

import { resolveGif, resolveLink } from '#/lib/api/resolve';
import type { Gif } from '#/lib/gif';

import { STALE } from '#/state/queries/index';
import { RQKEY_GIF, RQKEY_LINK } from '#/state/queries/resolve-link-key';
import { getClients } from '#/state/session';

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
