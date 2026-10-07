import { DisplayContext, getDisplayRestrictions, moderateProfile } from '@atcute/bluesky-moderation';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import type { AutocompleteEmoji, AutocompleteItem, AutocompleteProfile } from '#/state/queries/autocomplete';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import * as Autocomplete from '#/components/primitives/autocomplete';
import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';

import { m } from '#/paraglide/messages';

import * as styles from './MessageInputAutocomplete.css';

export type Placement = 'top' | 'top-start' | 'top-end' | 'bottom' | 'bottom-start' | 'bottom-end';

/**
 * mention and emoji suggestions within the message input's `Autocomplete.Root`.
 *
 * @param props.anchor element wrapping the completion text in the overlay
 * @param props.items suggestions
 * @param props.placement preferred popup placement
 * @returns the suggestions popup
 */
export function MessageInputAutocomplete({
	anchor,
	items,
	placement = 'bottom',
}: {
	anchor: Element | null;
	items: AutocompleteItem[];
	placement?: Placement;
}) {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `Placement` is a fixed `side` or `side-align` union
	const [side, align = 'start'] = placement.split('-') as ['bottom' | 'top', 'end' | 'start' | undefined];

	return (
		<Autocomplete.Positioner align={align} anchor={anchor} side={side} sideOffset={8}>
			<Autocomplete.Popup className={styles.popup}>
				{items.length === 0 ? (
					<CenteredSpinner label={m['common.status.loading']()} size="xl" />
				) : (
					<Autocomplete.List>
						{items.map((item) => {
							switch (item.type) {
								case 'emoji': {
									return <EmojiItem key={item.key} item={item} />;
								}
								case 'profile': {
									return <ProfileItem key={item.key} item={item} />;
								}
								default: {
									return null;
								}
							}
						})}
					</Autocomplete.List>
				)}
			</Autocomplete.Popup>
		</Autocomplete.Positioner>
	);
}

// cloned 1:1 from the search autocomplete's ProfileRow; keep the two in sync.
function ProfileItem({ item }: { item: AutocompleteProfile }) {
	const moderationOpts = useModerationOpts();
	const moderation = moderationOpts
		? getDisplayRestrictions(moderateProfile(item.profile, moderationOpts), DisplayContext.ProfileMedia)
		: undefined;

	return (
		<Autocomplete.Item className={styles.row} value={item}>
			<UserAvatar
				avatar={item.profile.avatar}
				className={styles.avatar}
				moderation={moderation}
				size={36}
				type={item.profile.associated?.labeler ? 'labeler' : 'user'}
			/>

			<span className={styles.text}>
				<Text numberOfLines={1} weight="medium">
					{item.profile.handle}
				</Text>
				{item.profile.displayName ? (
					<Text color="textContrastMedium" numberOfLines={1} size="md_sub">
						{item.profile.displayName}
					</Text>
				) : null}
			</span>
		</Autocomplete.Item>
	);
}

function EmojiItem({ item }: { item: AutocompleteEmoji }) {
	return (
		<Autocomplete.Item className={styles.row} value={item}>
			<Text className={styles.emojiGlyph}>{item.value}</Text>
			<Text className={styles.emojiName}>{item.label}</Text>
		</Autocomplete.Item>
	);
}
