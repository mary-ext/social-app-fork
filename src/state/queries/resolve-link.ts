import type { Client } from '@atcute/client';

import { type QueryClient, useQuery } from '@tanstack/react-query';

import { resolveGif, resolveLink } from '#/lib/api/resolve';
import type { Gif } from '#/lib/media/external-gif/types';

import { STALE } from '#/state/queries/index';
import { getClients } from '#/state/session';

const RQKEY_LINK_ROOT = 'resolve-link';
const RQKEY_LINK = (url: string) => [RQKEY_LINK_ROOT, url];

const RQKEY_GIF_ROOT = 'resolve-gif';
const RQKEY_GIF = (url: string) => [RQKEY_GIF_ROOT, url];

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
export function fetchResolveGifQuery(queryClient: QueryClient, gif: Gif) {
	return queryClient.fetchQuery({
		staleTime: STALE.HOURS.ONE,
		queryKey: RQKEY_GIF(gif.url),
		queryFn: async ({ signal }) => {
			return await resolveGif(gif, signal);
		},
	});
}
