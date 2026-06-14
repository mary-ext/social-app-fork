import { useMemo, useState } from 'react';
import type { AppBskyActorDefs } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderateProfile } from '@atcute/bluesky-moderation';
import { Trans, useLingui } from '@lingui/react/macro';
import { differenceInSeconds } from 'date-fns';

import { useGetTimeAgo } from '#/lib/hooks/useTimeAgo';
import { sanitizeDisplayName } from '#/lib/strings/display-names';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useSession } from '#/state/session';

import { Newskie } from '#/components/icons/Newskie';
import * as styles from '#/components/NewskieDialog.css';
import * as StarterPackCard from '#/components/StarterPack/StarterPackCard';
import { Text } from '#/components/Text';
import * as Dialog from '#/components/web/Dialog';

export function NewskieDialog({
	profile,
	disabled,
}: {
	profile: AppBskyActorDefs.ProfileViewDetailed;
	disabled?: boolean;
}) {
	const { t: l } = useLingui();
	const handle = Dialog.useDialogHandle();

	const createdAt = profile.createdAt;
	const [now] = useState(() => Date.now());
	const daysOld = useMemo(() => {
		if (!createdAt) return Infinity;
		return differenceInSeconds(now, new Date(createdAt)) / 86400;
	}, [createdAt, now]);

	if (!createdAt || daysOld > 7) return null;

	return (
		<Dialog.Root handle={handle}>
			<Dialog.Trigger
				aria-label={l`This user is new here. Press for more info about when they joined.`}
				className={styles.trigger}
				disabled={disabled}
			>
				<Newskie width={24} height={24} fill="currentColor" />
			</Dialog.Trigger>
			<Dialog.Popup size="narrow" label={l`New user info dialog`}>
				<DialogInner profile={profile} createdAt={createdAt} now={now} onClose={() => handle.close()} />
				<Dialog.Close />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({
	profile,
	createdAt,
	now,
	onClose,
}: {
	profile: AppBskyActorDefs.ProfileViewDetailed;
	createdAt: string;
	now: number;
	onClose: () => void;
}) {
	const { t: l } = useLingui();
	const moderationOpts = useModerationOpts();
	const { currentAccount } = useSession();
	const timeAgo = useGetTimeAgo();
	const isMe = profile.did === currentAccount?.did;

	const profileName = useMemo(() => {
		if (!moderationOpts) return profile.displayName || profile.handle;
		const moderation = moderateProfile(profile, moderationOpts);
		return sanitizeDisplayName(
			profile.displayName || profile.handle,
			getDisplayRestrictions(moderation, DisplayContext.ProfileBio),
		);
	}, [moderationOpts, profile]);

	const getJoinMessage = () => {
		const timeAgoString = timeAgo(createdAt, now, { format: 'long' });

		if (isMe) {
			if (profile.joinedViaStarterPack) {
				return l`You joined Bluesky using a starter pack ${timeAgoString} ago`;
			} else {
				return l`You joined Bluesky ${timeAgoString} ago`;
			}
		} else {
			if (profile.joinedViaStarterPack) {
				return l`${profileName} joined Bluesky using a starter pack ${timeAgoString} ago`;
			} else {
				return l`${profileName} joined Bluesky ${timeAgoString} ago`;
			}
		}
	};

	return (
		<div className={styles.content}>
			<div className={styles.header}>
				<div className={styles.icon}>
					<Newskie width={64} height={64} fill="currentColor" />
				</div>
				<Text size="xl" weight="semiBold">
					{isMe ? <Trans>Welcome, friend!</Trans> : <Trans>Say hello!</Trans>}
				</Text>
			</div>
			<Text size="md" align="center">
				{getJoinMessage()}
			</Text>
			{profile.joinedViaStarterPack ? (
				<StarterPackCard.Link starterPack={profile.joinedViaStarterPack} onPress={onClose}>
					<div className={styles.starterPack}>
						<StarterPackCard.Card starterPack={profile.joinedViaStarterPack} />
					</div>
				</StarterPackCard.Link>
			) : null}
		</div>
	);
}
