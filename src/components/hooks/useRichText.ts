import { useEffect, useState } from 'react';

import { createHandleResolver } from '#/lib/api/identity';
import { bakeRichtext, parseRichtext, resolveMentions, type Richtext } from '#/lib/strings/rich-text-facets';

import { getClients } from '#/state/session';

export function useRichText(text: string): [Richtext, boolean] {
	const { appview } = getClients();
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
			const segments = await resolveMentions(parseRichtext(text), createHandleResolver(appview));
			if (!ignore) {
				setResolvedRT(bakeRichtext(segments));
			}
		}
		void resolveRTFacets();
		return () => {
			ignore = true;
		};
	}, [text, appview]);
	const isResolving = resolvedRT === null;
	return [resolvedRT ?? rawRT, isResolving];
}
