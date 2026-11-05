import type { AppBskyActorDefs } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, type ModerationDecision } from '@atcute/bluesky-moderation';

import { clsx } from 'clsx';

import type { Shadow } from '#/state/cache/types';

import { NewskieDialog } from '#/components/NewskieDialog';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';

import * as styles from './Handle.css';

export function ProfileHeaderHandle({
	profile,
	moderation,
	disableTaps,
}: {
	profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>;
	moderation: ModerationDecision;
	disableTaps?: boolean;
}) {
	const blockHide = profile.viewer?.blocking || profile.viewer?.blockedBy;
	const pronouns = profile.pronouns?.trim();
	const showPronouns =
		!!pronouns &&
		!blockHide &&
		getDisplayRestrictions(moderation, DisplayContext.ProfileView).blurs.length === 0;

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

			<div className={styles.handleRow}>
				<Text numberOfLines={1} size="md" leading="snug" color="textContrastMedium" className={styles.handle}>
					{profile.handle}
				</Text>
				{showPronouns && (
					// the handle truncates first so the pronouns stay whole
					<Text
						numberOfLines={1}
						size="md"
						leading="snug"
						color="textContrastMedium"
						className={styles.pronouns}
					>
						{pronouns}
					</Text>
				)}
			</div>
		</div>
	);
}
