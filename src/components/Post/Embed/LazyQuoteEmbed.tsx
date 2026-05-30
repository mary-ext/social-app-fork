import { useMemo } from 'react';
import { View } from 'react-native';
import { type AppBskyFeedDefs } from '@atcute/bluesky';

import { createEmbedViewRecordFromPost } from '#/state/queries/postgate/util';
import { useResolveLinkQuery } from '#/state/queries/resolve-link';

import { atoms as a, useTheme } from '#/alf';

import { QuoteEmbed } from '#/components/Post/Embed';

import { type EmbedType } from '#/types/bsky/post';

export function LazyQuoteEmbed({ uri, linkDisabled }: { uri: string; linkDisabled?: boolean }) {
	const t = useTheme();
	const { data } = useResolveLinkQuery(uri);

	const view = useMemo(() => {
		if (!data || data.type !== 'record' || data.kind !== 'post') return;
		// TODO(atcute Phase 2.5): drop cast once resolve-link flips to @atcute types
		return createEmbedViewRecordFromPost(data.view as unknown as AppBskyFeedDefs.PostView);
	}, [data]);

	return view ? (
		<QuoteEmbed
			embed={{
				type: 'post',
				// TODO(atcute Phase 2.4): drop cast once Embed types flip to @atcute
				view: view as unknown as EmbedType<'post'>['view'],
			}}
			linkDisabled={linkDisabled}
		/>
	) : (
		<View
			style={[
				a.w_full,
				a.rounded_md,
				t.atoms.bg_contrast_25,
				{
					height: 68,
				},
			]}
		/>
	);
}
