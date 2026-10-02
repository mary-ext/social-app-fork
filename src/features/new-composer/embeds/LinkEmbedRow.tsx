import { usePostState } from '../context';
import { getPostInfo } from '../model/post-info';
import { LinkCard } from './LinkCard';
import * as css from './LinkEmbedRow.css';

/**
 * previews of the links a post embeds.
 *
 * @param props the post's id
 * @returns the row, or null if the post embeds no links
 */
export function LinkEmbedRow({ postId }: { postId: string }) {
	const external = usePostState(postId, (state, post) => getPostInfo(state, post.node).embeds.external, null);
	const record = usePostState(postId, (state, post) => getPostInfo(state, post.node).embeds.record, null);

	if (!external && !record) {
		return null;
	}

	// media slot first, like a published record-with-media embed.
	return (
		<div className={css.root}>
			{external && <LinkCard key={external} postId={postId} url={external} kind="external" />}
			{record && <LinkCard key={record} postId={postId} url={record} kind="record" />}
		</div>
	);
}
