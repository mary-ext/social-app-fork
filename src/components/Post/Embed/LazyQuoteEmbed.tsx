import { useMemo } from 'react';

import { createEmbedViewRecordFromPost } from '#/state/queries/postgate/util';
import { useResolveLinkQuery } from '#/state/queries/resolve-link';

import { QuoteEmbed } from '#/components/Post/Embed';

import * as css from './LazyQuoteEmbed.css';

export function LazyQuoteEmbed({ uri, linkDisabled }: { uri: string; linkDisabled?: boolean }) {
	const { data } = useResolveLinkQuery(uri);

	const view = useMemo(() => {
		if (!data || data.type !== 'record' || data.kind !== 'post') return;
		return createEmbedViewRecordFromPost(data.view);
	}, [data]);

	return view ? (
		<QuoteEmbed
			embed={{
				type: 'post',
				view: view,
			}}
			linkDisabled={linkDisabled}
		/>
	) : (
		<div className={css.skeleton} />
	);
}
