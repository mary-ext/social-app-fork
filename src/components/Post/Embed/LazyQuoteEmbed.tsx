import { createEmbedViewRecordFromPost } from '#/state/queries/postgate/util';
import { useResolveLinkQuery } from '#/state/queries/resolve-link';

import { QuoteEmbed } from '#/components/Post/Embed';

import * as css from './LazyQuoteEmbed.css';

export function LazyQuoteEmbed({ uri, linkDisabled }: { uri: string; linkDisabled?: boolean }) {
	const { data } = useResolveLinkQuery(uri);

	let view;
	if (data && data.type === 'record' && data.kind === 'post') {
		view = createEmbedViewRecordFromPost(data.view);
	}

	return view ? <QuoteEmbed embed={view} linkDisabled={linkDisabled} /> : <div className={css.skeleton} />;
}
