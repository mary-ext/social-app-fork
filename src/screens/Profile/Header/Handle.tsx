import type { AppBskyActorDefs } from '@atcute/bluesky';
import { clsx } from 'clsx';

import type { Shadow } from '#/state/cache/types';

import { NewskieDialog } from '#/components/NewskieDialog';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';

import * as styles from './Handle.css';

export function ProfileHeaderHandle({
	profile,
	disableTaps,
}: {
	profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>;
	disableTaps?: boolean;
}) {
	const blockHide = profile.viewer?.blocking || profile.viewer?.blockedBy;
	return (
		<div className={clsx(styles.row, disableTaps && styles.noTaps)}>
			<NewskieDialog profile={profile} disabled={disableTaps} />

			{profile.viewer?.followedBy && !blockHide ? (
				<div className={styles.followsYou}>
					<Text size="sm" color="text">
						{m['common.follow.followsYou']()}
					</Text>
				</div>
			) : undefined}

			<Text numberOfLines={1} size="md" leading="snug" color="textContrastMedium" className={styles.handle}>
				{profile.handle}
			</Text>
		</div>
	);
}
