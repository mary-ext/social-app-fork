import type { AppBskyActorDefs } from '@atcute/bluesky';

import { PostNumberBlock } from '#/components/PostNumber';
import { ProfileBadges } from '#/components/ProfileBadges';
import { Text } from '#/components/Text';

import * as styles from './PostHeader.css';

/**
 * author handle, badges, and thread position above a post's text.
 *
 * @param props the author profile (undefined while loading), zero-based post index, and total post count
 * @returns the post's header
 */
export function PostHeader({
	profile,
	index,
	total,
}: {
	profile: AppBskyActorDefs.ProfileViewDetailed | undefined;
	index: number;
	total: number;
}) {
	return (
		<div className={styles.root}>
			<Text color="textContrastHigh" size="md" weight="semiBold" numberOfLines={1}>
				{profile?.handle}
			</Text>
			{profile && <ProfileBadges className={styles.badges} profile={profile} size="sm" />}
			{total > 1 && (
				<div className={styles.number}>
					<PostNumberBlock value={{ index: index + 1, count: total }} />
				</div>
			)}
		</div>
	);
}
