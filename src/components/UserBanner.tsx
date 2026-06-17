import type { DisplayRestrictions } from '@atcute/bluesky-moderation';
import { clsx } from 'clsx';

import * as styles from '#/components/UserBanner.css';

/** The profile banner image, or a typed solid fallback when the profile has none. */
export function UserBanner({
	banner,
	moderation,
	type = 'default',
}: {
	banner?: string | null;
	moderation?: DisplayRestrictions;
	type?: 'default' | 'labeler';
}) {
	if (banner) {
		return (
			<div className={styles.banner}>
				<img
					alt=""
					className={clsx(styles.image, (moderation?.blurs.length ?? 0) > 0 && styles.blurred)}
					src={banner}
				/>
			</div>
		);
	}
	return <div className={clsx(styles.banner, type === 'labeler' && styles.labelerFallback)} />;
}
