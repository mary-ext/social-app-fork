import type { DisplayRestrictions } from '@atcute/bluesky-moderation';
import { clsx } from 'clsx';

import * as styles from '#/components/web/UserBanner.css';

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
			<img
				alt=""
				className={clsx(styles.banner, (moderation?.blurs.length ?? 0) > 0 && styles.blurred)}
				src={banner}
			/>
		);
	}
	return <div className={clsx(styles.fallback, type === 'labeler' && styles.labelerFallback)} />;
}
