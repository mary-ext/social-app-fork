import { ok } from '@atcute/client';
import type { ResourceUri } from '@atcute/lexicons';
import type { ShTangledString } from '@atcute/tangled';

import { useQuery } from '@tanstack/react-query';

import { slingshotClient } from '#/lib/api/slingshot-client';

import { STALE } from '#/state/queries';

const RQKEY_ROOT = 'tangled-string';
export const RQKEY = (uri: ResourceUri) => [RQKEY_ROOT, uri];

/**
 * queries a Tangled string record.
 *
 * @param uri record at-uri
 * @returns the record query
 */
export function useTangledStringQuery({ uri }: { uri: ResourceUri }) {
	return useQuery({
		queryKey: RQKEY(uri),
		staleTime: STALE.MINUTES.FIFTEEN,
		async queryFn({ signal }) {
			const response = await ok(
				slingshotClient.get('blue.microcosm.repo.getRecordByUri', {
					signal,
					params: { at_uri: uri },
				}),
			);

			// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- collection determines value type
			return response.value as unknown as ShTangledString.Main;
		},
	});
}
