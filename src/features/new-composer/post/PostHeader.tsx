import { memo } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';

import type { Wordgard } from 'wordgard/editor';

import { PostNumberBlock } from '#/components/PostNumber';
import { ProfileBadges } from '#/components/ProfileBadges';
import { Text } from '#/components/Text';
import { Button, ButtonIcon } from '#/components/web/Button';

import CrossIcon from '#/icons/central/CrossLarge_round_outlined_radius1_stroke2.svg';

import { removePost } from '../commands/remove-post';
import { keepEditorFocus } from '../focus';
import * as styles from './PostHeader.css';

/**
 * post attribution, thread position, and removal button.
 *
 * @param props the editor, post id, profile, zero-based index, post count, and whether controls are tabbable
 * @returns the post's header
 */
export const PostHeader = memo(function PostHeader({
	wg,
	postId,
	profile,
	index,
	total,
	isActive,
}: {
	wg: Wordgard;
	postId: string;
	profile: AppBskyActorDefs.ProfileViewDetailed | undefined;
	index: number;
	total: number;
	isActive: boolean;
}) {
	return (
		<div className={styles.root}>
			<Text color="textContrastHigh" size="md" weight="semiBold" numberOfLines={1}>
				{profile?.handle}
			</Text>
			{profile && <ProfileBadges className={styles.badges} profile={profile} size="sm" />}
			{total > 1 && (
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
						<ButtonIcon icon={CrossIcon} />
					</Button>
				</>
			)}
		</div>
	);
});
