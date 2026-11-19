import type { AnyProfileView } from '@atcute/bluesky';

import { useSession } from '#/state/session';

import { relativeMessageParts } from '#/locale/intl/timeAgo';

import * as StarterPackCard from '#/features/starter-packs/StarterPackCard';

import * as styles from '#/components/NewskieDialog.css';
import { Stack } from '#/components/Stack';
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
	profile: AnyProfileView;
	createdAt: string;
	now: Date;
	onClose: () => void;
}) {
	const { currentAccount } = useSession();
	const isMe = profile.did === currentAccount?.did;

	const profileName = profile.handle;
	// only detailed views carry the starter pack.
	const joinedViaStarterPack = 'joinedViaStarterPack' in profile ? profile.joinedViaStarterPack : undefined;

	const getJoinMessage = () => {
		const { isNow, unit, value } = relativeMessageParts(createdAt, now);
		const when: 'now' | 'past' = isNow ? 'now' : 'past';
		const parts = { unit, value, when };

		if (isMe) {
			if (joinedViaStarterPack) {
				return m['components.newskieDialog.joinedViaStarterPackSelf'](parts);
			}
			return m['components.newskieDialog.joinedAgoSelf'](parts);
		}
		if (joinedViaStarterPack) {
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
			{joinedViaStarterPack ? (
				<StarterPackCard.Link starterPack={joinedViaStarterPack} onPress={onClose}>
					<div className={styles.starterPack}>
						<StarterPackCard.Card starterPack={joinedViaStarterPack} />
					</div>
				</StarterPackCard.Link>
			) : null}
		</Stack>
	);
}
