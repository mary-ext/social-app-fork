import { useEffect, useState } from 'react';
import { ok } from '@atcute/client';
import type { Handle } from '@atcute/lexicons';

import { detectFacets, type Richtext } from '#/lib/strings/rich-text-facets';

import { useClients } from '#/state/session';

export function useRichText(text: string): [Richtext, boolean] {
	const { appview } = useClients();
	const [prevText, setPrevText] = useState(text);
	const [rawRT, setRawRT] = useState<Richtext>(() => ({ text, facets: [] }));
	const [resolvedRT, setResolvedRT] = useState<Richtext | null>(null);
	if (text !== prevText) {
		setPrevText(text);
		setRawRT({ text, facets: [] });
		setResolvedRT(null);
		// This will queue an immediate re-render
	}
	useEffect(() => {
		let ignore = false;
		async function resolveRTFacets() {
			const resolvedRT = await detectFacets(text, async (handle) => {
				try {
					const res = await ok(
						appview.get('com.atproto.identity.resolveHandle', {
							params: { handle: handle as Handle },
						}),
					);
					return res.did;
				} catch {
					return undefined;
				}
			});
			if (!ignore) {
				setResolvedRT(resolvedRT);
			}
		}
		resolveRTFacets();
		return () => {
			ignore = true;
		};
	}, [text, appview]);
	const isResolving = resolvedRT === null;
	return [resolvedRT ?? rawRT, isResolving];
}
