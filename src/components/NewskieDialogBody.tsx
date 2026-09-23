import type { AppBskyActorDefs } from '@atcute/bluesky';

import { useSession } from '#/state/session';

import { relativeMessageParts } from '#/locale/intl/timeAgo';

import * as styles from '#/components/NewskieDialog.css';
import { Stack } from '#/components/Stack';
import * as StarterPackCard from '#/components/StarterPack/StarterPackCard';
import { Text } from '#/components/Text';

import Newskie from '#/icons/central-custom/Newskie_round_filled_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

/**
 * shows when a profile joined and, if applicable, its starter pack.
 *
 * @param props profile, join date, and close handler
 * @returns the new-account card
 */
export function NewskieDialogBody({
	profile,
	createdAt,
	now,
	onClose,
}: {
	profile: AppBskyActorDefs.ProfileViewDetailed;
	createdAt: string;
	now: Date;
	onClose: () => void;
}) {
	const { currentAccount } = useSession();
	const isMe = profile.did === currentAccount?.did;

	const profileName = profile.handle;

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
					<Newskie className={styles.headerIcon} />
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
