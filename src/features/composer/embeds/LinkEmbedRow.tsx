import { lazy, Suspense, useEffect } from 'react';

import { usePostState } from '../context';
import { getPostInfo } from '../model/post-info';
import * as css from './LinkEmbedRow.css';

const loadCards = () => import('./LinkCard');

const LinkCard = lazy(() => loadCards().then((mod) => ({ default: mod.LinkCard })));
const QuoteCard = lazy(() => loadCards().then((mod) => ({ default: mod.QuoteCard })));

/**
 * link and quote previews for a post.
 *
 * @param props the post's id
 * @returns the row, or null if the post has no link or quote embeds
 */
export function LinkEmbedRow({ postId }: { postId: string }) {
	// preload preview components before a link is pasted.
	useEffect(() => {
		void loadCards();
	}, []);

	const external = usePostState(postId, (state, post) => getPostInfo(state, post.node).embeds.external, null);
	const quote = usePostState(postId, (state, post) => getPostInfo(state, post.node).embeds.quote, null);
	const record = usePostState(postId, (state, post) => getPostInfo(state, post.node).embeds.record, null);

	if (!external && !quote && !record) {
		return null;
	}

	// media slot first, like a published record-with-media embed.
	return (
		<Suspense fallback={null}>
			<div className={css.root}>
				{external && <LinkCard key={external} postId={postId} url={external} kind="external" />}
				{quote && <QuoteCard key={quote} postId={postId} uri={quote} />}
				{record && <LinkCard key={record} postId={postId} url={record} kind="record" />}
			</div>
		</Suspense>
	);
}
