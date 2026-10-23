import type { Did } from '@atcute/lexicons/syntax';

import type { QueryClient } from '@tanstack/react-query';

import { RQKEY_AUTHOR } from '#/state/queries/feed/keys';

export function resetProfilePostsQueries(queryClient: QueryClient, did: Did, timeout = 0) {
	setTimeout(() => {
		void queryClient.resetQueries({ queryKey: RQKEY_AUTHOR(did) });
	}, timeout);
}
