import type { ModerationOptions } from '@atcute/bluesky-moderation';
import type { Did } from '@atcute/lexicons';

import { useQuery } from '@tanstack/react-query';

import { getClaimedHandle } from '#/lib/api/did-document';
import type { FlaggedFollow } from '#/lib/follow-cleanup';

import { GCTIME, STALE } from '#/state/queries';

import { dateMedium } from '#/locale/intl/datetime';

import * as Toggle from '#/components/forms/Toggle';
import { Text } from '#/components/Text';
import * as ProfileCard from '#/components/web/ProfileCard';

import { m } from '#/paraglide/messages';

import { FOLLOW_ISSUE_LABELS } from './follow-issue-labels';
import * as styles from './FollowRow.css';

const formatFollowedAt = (followedAt: string): string | undefined => {
	const date = new Date(followedAt);
	return Number.isNaN(date.getTime()) ? undefined : dateMedium.format(date);
};

/**
 * renders a selectable flagged follow with optional, unverified handle metadata.
 *
 * @param props follow, moderation options, and selection controls
 * @returns the follow row
 */
export const FollowRow = ({
	follow,
	isUnfollowing,
	moderationOpts,
	onToggle,
	selected,
}: {
	follow: FlaggedFollow;
	isUnfollowing: boolean;
	moderationOpts: ModerationOptions;
	onToggle: (did: Did) => void;
	selected: boolean;
}) => {
	const { did, issues, profile } = follow;
	const { data: claimedHandle } = useQuery({
		enabled: !profile,
		gcTime: GCTIME.MINUTES.FIVE,
		queryKey: ['claimed-handle', did],
		// cache missing handles too; query functions cannot return undefined.
		queryFn: async ({ signal }) => (await getClaimedHandle(did, signal)) ?? null,
		retry: false,
		staleTime: STALE.MINUTES.FIVE,
	});
	const followedAt = follow.followedAt && formatFollowedAt(follow.followedAt);

	return (
		<Toggle.Item
			checked={selected}
			className={styles.row}
			disabled={isUnfollowing}
			label={profile?.handle ?? claimedHandle ?? did}
			onChange={() => onToggle(did)}
		>
			<Toggle.CheckboxIndicator />
			<div className={styles.rowBody}>
				{profile ? (
					<ProfileCard.Header>
						<ProfileCard.Avatar disabledPreview moderationOpts={moderationOpts} profile={profile} size={32} />
						<ProfileCard.NameAndHandle moderationOpts={moderationOpts} profile={profile} />
					</ProfileCard.Header>
				) : claimedHandle ? (
					<Text color="textContrastHigh" size="md" weight="semiBold">
						{claimedHandle}
					</Text>
				) : (
					<Text className={styles.did} color="textContrastHigh" size="xs">
						{did}
					</Text>
				)}

				<span className={styles.issues}>
					{issues.map((issue) => (
						<Text className={styles.issuePill} color="textContrastHigh" key={issue} size="xs">
							{FOLLOW_ISSUE_LABELS[issue]()}
						</Text>
					))}
					{followedAt && (
						<Text color="textContrastMedium" size="xs">
							{m['components.followCleanupDialog.followedAt']({ date: followedAt })}
						</Text>
					)}
					{!profile && claimedHandle && (
						<Text
							className={styles.metadataDid}
							color="textContrastMedium"
							numberOfLines={1}
							size="xs"
							title={did}
						>
							{did}
						</Text>
					)}
				</span>
			</div>
		</Toggle.Item>
	);
};
