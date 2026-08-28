import { useQuery } from '@tanstack/react-query';

import { GCTIME, STALE } from '#/state/queries';

const RQKEY_ROOT = 'code-highlight';
export const RQKEY = (filename: string, contents: string) => [RQKEY_ROOT, filename, contents];

/**
 * caches highlighted source code.
 *
 * @param contents source to highlight
 * @param filename filename used for detection
 * @returns the highlight query
 */
export function useCodeHighlightQuery({ contents, filename }: { contents: string; filename: string }) {
	return useQuery({
		queryKey: RQKEY(filename, contents),
		staleTime: STALE.INFINITY,
		gcTime: GCTIME.MINUTES.FIVE,
		async queryFn() {
			const { highlightSource } = await import('#/lib/code/highlight');

			return await highlightSource({ contents, filename });
		},
	});
}
