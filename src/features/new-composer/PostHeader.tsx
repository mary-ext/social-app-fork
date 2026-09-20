import type { AppBskyActorDefs } from '@atcute/bluesky';

import { ProfileBadges } from '#/components/ProfileBadges';
import { Text } from '#/components/Text';

import * as styles from './PostHeader.css';

/**
 * author handle and badges above a post's text.
 *
 * @param props the author profile, absent until it loads
 * @returns the post's header
 */
export function PostHeader({ profile }: { profile: AppBskyActorDefs.ProfileViewDetailed | undefined }) {
	return (
		<div className={styles.root}>
			<Text color="textContrastHigh" size="md" weight="semiBold" numberOfLines={1}>
				{profile?.handle}
			</Text>
			{profile && <ProfileBadges className={styles.badges} profile={profile} size="sm" />}
		</div>
	);
}
