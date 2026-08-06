import { useQuery } from '@tanstack/react-query';

import { resolveShortLink } from '#/lib/links/short-link';
import { parseStarterPackUri } from '#/lib/starter-pack';

import { STALE } from '#/state/queries/index';

const RQKEY_ROOT = 'resolved-short-link';
export const RQKEY = (code: string) => [RQKEY_ROOT, code];

export function useResolvedStarterPackShortLink({ code }: { code: string }) {
	return useQuery({
		queryKey: RQKEY(code),
		enabled: !!code,
		staleTime: STALE.HOURS.ONE,
		retry: 1,
		queryFn: async () => {
			const res = await resolveShortLink(code);
			return parseStarterPackUri(res);
		},
	});
}
