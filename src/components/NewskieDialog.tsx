import { useMemo } from 'react';
import type { AppBskyActorDefs } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderateProfile } from '@atcute/bluesky-moderation';
import { differenceInSeconds } from 'date-fns';

import { useConstant } from '#/lib/hooks/use-constant';
import { sanitizeDisplayName } from '#/lib/strings/display-names';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useSession } from '#/state/session';

import { useGetTimeAgo } from '#/locale/intl/timeAgo';

import { Newskie } from '#/components/icons/Newskie';
import * as styles from '#/components/NewskieDialog.css';
import * as StarterPackCard from '#/components/StarterPack/StarterPackCard';
import { Text } from '#/components/Text';
import * as Dialog from '#/components/web/Dialog';

import { m } from '#/paraglide/messages';

export function NewskieDialog({
	profile,
	disabled,
}: {
	profile: AppBskyActorDefs.ProfileViewDetailed;
	disabled?: boolean;
}) {
	const handle = Dialog.useDialogHandle();

	const createdAt = profile.createdAt;
	const now = useConstant(Date.now);
	const daysOld = useMemo(() => {
		if (!createdAt) return Infinity;
		return differenceInSeconds(now, new Date(createdAt)) / 86400;
	}, [createdAt, now]);

	if (!createdAt || daysOld > 7) return null;

	return (
		<Dialog.Root handle={handle}>
			<Dialog.Trigger
				aria-label={m['components.newskieDialog.a11y.hint']()}
				className={styles.trigger}
				disabled={disabled}
			>
				<Newskie width={24} height={24} fill="currentColor" />
			</Dialog.Trigger>
			<Dialog.Popup size="narrow" label={m['components.newskieDialog.a11y.dialog']()}>
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
				return m['components.newskieDialog.joinedViaStarterPackSelf']({ timeAgoString });
			} else {
				return m['components.newskieDialog.joinedAgoSelf']({ timeAgoString });
			}
		} else {
			if (profile.joinedViaStarterPack) {
				return m['components.newskieDialog.joinedViaStarterPack']({ profileName, timeAgoString });
			} else {
				return m['components.newskieDialog.joinedAgo']({ profileName, timeAgoString });
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
					{isMe ? m['components.newskieDialog.welcome']() : m['common.label.sayHello']()}
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
