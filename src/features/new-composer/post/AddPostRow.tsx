import { useCurrentAccountProfile } from '#/state/queries/profile';

import { Text } from '#/components/Text';

import { appendPost } from '../commands/append-post';
import { useEditor, useEditorState } from '../context';
import { isBlankPost } from '../editor/post-info';
import { getPosts } from '../editor/schema';
import * as threadEnd from '../thread-end.css';
import * as styles from './AddPostRow.css';
import { Avatar } from './PostRail';

const GHOST_AVATAR_SIZE = 20;

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
			className={styles.root}
			disabled={isDisabled}
			onClick={() => {
				appendPost(wg, { userEvent: 'input.post' });
				wg.focus();
			}}
		>
			<span className={styles.avatar}>
				<Avatar profile={profile} size={GHOST_AVATAR_SIZE} noBorder />
			</span>
			<Text size="md" className={threadEnd.label}>
				Add to thread
			</Text>
		</button>
	);
}
