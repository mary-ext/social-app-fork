import type { AppBskyActorDefs } from '@atcute/bluesky';
import { DisplayContext, getDisplayRestrictions, moderateProfile } from '@atcute/bluesky-moderation';

import { differenceInSeconds } from 'date-fns';

import { useConstant } from '#/lib/hooks/use-constant';
import { sanitizeDisplayName } from '#/lib/strings/display-names';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useSession } from '#/state/session';

import { relativeMessageParts } from '#/locale/intl/timeAgo';

import * as Dialog from '#/components/Dialog';
import { Newskie } from '#/components/icons/Newskie';
import * as styles from '#/components/NewskieDialog.css';
import { Stack } from '#/components/Stack';
import * as StarterPackCard from '#/components/StarterPack/StarterPackCard';
import { Text } from '#/components/Text';

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
	const daysOld = createdAt ? differenceInSeconds(now, new Date(createdAt)) / 86400 : Infinity;

	if (!createdAt || daysOld > 7) return null;

	return (
		<Dialog.Root handle={handle}>
			<Dialog.Trigger
				aria-label={m['components.newskieDialog.a11y.hint']()}
				className={styles.trigger}
				disabled={disabled}
			>
				<Newskie size="xl" fill="currentColor" />
			</Dialog.Trigger>
			<Dialog.Popup size="narrow" label={m['components.newskieDialog.a11y.label']()}>
				<DialogInner profile={profile} createdAt={createdAt} now={now} onClose={() => handle.close()} />
				<Dialog.Close variant="floating" />
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
	const isMe = profile.did === currentAccount?.did;

	let profileName = profile.displayName || profile.handle;
	if (moderationOpts) {
		const moderation = moderateProfile(profile, moderationOpts);
		profileName = sanitizeDisplayName(
			profile.displayName || profile.handle,
			getDisplayRestrictions(moderation, DisplayContext.ProfileBio),
		);
	}

	const getJoinMessage = () => {
		const parts = relativeMessageParts(createdAt, now);

		if (isMe) {
			if (profile.joinedViaStarterPack) {
				return m['components.newskieDialog.joinedViaStarterPackSelf'](parts);
			}
			return m['components.newskieDialog.joinedAgoSelf'](parts);
		}
		if (profile.joinedViaStarterPack) {
			return m['components.newskieDialog.joinedViaStarterPack']({ ...parts, name: profileName });
		}
		return m['components.newskieDialog.joinedAgo']({ ...parts, name: profileName });
	};

	return (
		<Stack gap="md">
			<div className={styles.header}>
				<div className={styles.icon}>
					<Newskie size="5xl" fill="currentColor" />
				</div>
				<Text size="xl" weight="semiBold">
					{isMe ? m['components.newskieDialog.welcome']() : m['common.compose.sayHello']()}
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
		</Stack>
	);
}
