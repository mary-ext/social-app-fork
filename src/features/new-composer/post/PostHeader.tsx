import { useCurrentAccountProfile } from '#/state/queries/profile';

import { PostNumberBlock } from '#/components/PostNumber';
import { ProfileBadges } from '#/components/ProfileBadges';
import { Text } from '#/components/Text';
import { Button } from '#/components/web/Button';

import CrossIcon from '#/icons/central/CrossLarge_round_outlined_radius1_stroke2.svg';

import { removePost } from '../commands/remove-post';
import { useEditor, useIsActivePost, usePostCount, usePostState } from '../context';
import { keepEditorFocus } from '../focus';
import * as styles from './PostHeader.css';

/**
 * post attribution, thread position, and removal button.
 *
 * @param props the post's id
 * @returns the post's header
 */
export function PostHeader({ postId }: { postId: string }) {
	const profile = useCurrentAccountProfile();
	const total = usePostCount();

	return (
		<div className={styles.root}>
			<Text color="textContrastHigh" size="md" weight="semiBold" numberOfLines={1}>
				{profile?.handle}
			</Text>
			{profile && <ProfileBadges className={styles.badges} profile={profile} size="sm" />}
			{total > 1 && <ThreadPosition postId={postId} total={total} />}
		</div>
	);
}

function ThreadPosition({ postId, total }: { postId: string; total: number }) {
	const wg = useEditor();
	const index = usePostState(postId, (_state, post) => post.index, 0);
	const isActive = useIsActivePost(postId);

	return (
		<>
			<div className={styles.number}>
				<PostNumberBlock value={{ index: index + 1, count: total }} />
			</div>
			<Button
				className={styles.remove}
				label="Remove post"
				tabIndex={isActive ? 0 : -1}
				variant="ghost"
				color="secondary"
				shape="round"
				size="tiny"
				onMouseDown={keepEditorFocus}
				onClick={() => {
					removePost(wg, postId);
					// removing the post removes the focused button.
					wg.focus();
				}}
			>
				<CrossIcon className={styles.removeIcon} />
			</Button>
		</>
	);
}
