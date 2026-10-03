import { useCurrentAccountProfile } from '#/state/queries/profile';

import { Text } from '#/components/Text';

import { appendPost } from '../commands/append-post';
import { useEditor, useEditorState } from '../context';
import { isBlankPost } from '../model/post-info';
import { getPosts } from '../model/schema';
import { Avatar } from '../post/Avatar';
import { GHOST_AVATAR_SIZE } from '../shared/layout';
import * as css from './AddPostRow.css';

/**
 * button to append a post to the thread, disabled while the last post is blank.
 *
 * @returns the add-post button
 */
export function AddPostRow() {
	const wg = useEditor();
	const profile = useCurrentAccountProfile();
	const isDisabled = useEditorState((state) => {
		const last = getPosts(state.doc).at(-1);
		return !last || isBlankPost(state, last.node);
	});

	return (
		<button
			type="button"
			tabIndex={-1}
			className={css.root}
			disabled={isDisabled}
			onClick={() => {
				appendPost(wg, { userEvent: 'input.post' });
				wg.focus();
			}}
		>
			<span className={css.avatar}>
				<Avatar profile={profile} size={GHOST_AVATAR_SIZE} noBorder />
			</span>
			<Text size="md" className={css.label}>
				Add to thread
			</Text>
		</button>
	);
}
