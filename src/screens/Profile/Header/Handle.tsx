import type { AppBskyActorDefs } from '@atcute/bluesky';
import { Trans, useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';

import { isInvalidHandle, sanitizeHandle } from '#/lib/strings/handles';

import type { Shadow } from '#/state/cache/types';

import { NewskieDialog } from '#/components/NewskieDialog';
import { Text } from '#/components/Text';

import * as styles from './Handle.css';

export function ProfileHeaderHandle({
	profile,
	disableTaps,
}: {
	profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>;
	disableTaps?: boolean;
}) {
	const { t: l } = useLingui();
	const invalidHandle = isInvalidHandle(profile.handle);
	const blockHide = profile.viewer?.blocking || profile.viewer?.blockedBy;
	return (
		<div className={clsx(styles.row, disableTaps && styles.noTaps)}>
			<NewskieDialog profile={profile} disabled={disableTaps} />
			{profile.viewer?.followedBy && !blockHide ? (
				<div className={styles.followsYou}>
					<Text size="sm" color="text">
						<Trans>Follows you</Trans>
					</Text>
				</div>
			) : undefined}
			<Text
				numberOfLines={1}
				size={invalidHandle ? 'xs' : 'md'}
				leading={invalidHandle ? undefined : 'snug'}
				color={invalidHandle ? undefined : 'textContrastMedium'}
				className={clsx(styles.handle, invalidHandle && styles.invalidHandle)}
			>
				{invalidHandle ? l`⚠Invalid Handle` : sanitizeHandle(profile.handle, '@', false)}
			</Text>
		</div>
	);
}
