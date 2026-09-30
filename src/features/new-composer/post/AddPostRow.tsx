import type { AppBskyActorDefs } from '@atcute/bluesky';

import type { Wordgard } from 'wordgard/editor';

import { Text } from '#/components/Text';

import { appendPost } from '../commands/append-post';
import * as threadEnd from '../thread-end.css';
import * as styles from './AddPostRow.css';
import { Avatar } from './PostRail';

const GHOST_AVATAR_SIZE = 20;

/**
 * button to append a post to the thread.
 *
 * @param props the editor, author profile, and whether adding a post is disabled
 * @returns the add-post button
 */
export function AddPostRow({
	wg,
	profile,
	isDisabled,
}: {
	wg: Wordgard;
	profile: AppBskyActorDefs.ProfileViewDetailed | undefined;
	isDisabled: boolean;
}) {
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
