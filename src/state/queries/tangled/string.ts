import { ok } from '@atcute/client';
import type { ActorIdentifier, ResourceUri } from '@atcute/lexicons';
import type { OrgTangledSnippetString } from '@atcute/tangled';

import { useQuery } from '@tanstack/react-query';

import { syncBlobUrl } from '#/lib/api/records';
import { resolveMiniDoc, slingshotClient } from '#/lib/api/slingshot-client';
import { STALE } from '#/lib/query/const';

const RQKEY_ROOT = 'tangled-string';
export const RQKEY = (uri: ResourceUri) => [RQKEY_ROOT, uri];

// embeds fetch automatically, so refuse files far larger than any snippet worth previewing.
const MAX_CONTENT_SIZE = 1024 * 1024;

export interface TangledString {
	filename: string;
	contents: string;
}

/**
 * queries a Tangled string record along with its file contents.
 *
 * @param options.actor the record's author
 * @param options.uri record at-uri
 * @returns the string query
 */
export function useTangledStringQuery({ actor, uri }: { actor: ActorIdentifier; uri: ResourceUri }) {
	return useQuery({
		queryKey: RQKEY(uri),
		staleTime: STALE.MINUTES.FIFTEEN,
		async queryFn({ signal }): Promise<TangledString> {
			const [response, { did, pds }] = await Promise.all([
				ok(
					slingshotClient.get('blue.microcosm.repo.getRecordByUri', {
						signal,
						params: { at_uri: uri },
					}),
				),
				resolveMiniDoc(actor, signal),
			]);

			// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- collection determines value type
			const { snippet } = response.value as unknown as OrgTangledSnippetString.Main;

			// the snippet union is open; only plain text files are known so far.
			if (snippet.$type !== undefined && snippet.$type !== 'org.tangled.snippet.string#textFile') {
				throw new Error(`unsupported snippet type`);
			}
			let cid: string;
			{
				const content = snippet.content;
				if ('ref' in content) {
					if (content.size > MAX_CONTENT_SIZE) {
						throw new Error(`snippet is too large`);
					}
					cid = content.ref.$link;
				} else {
					// legacy blobs don't declare a size.
					cid = content.cid;
				}
			}

			const blob = await fetch(syncBlobUrl({ pdsUrl: pds, did, cid }), { signal });
			if (!blob.ok) {
				throw new Error(`getBlob responded ${blob.status}`);
			}

			return { filename: snippet.name, contents: await blob.text() };
		},
	});
}
