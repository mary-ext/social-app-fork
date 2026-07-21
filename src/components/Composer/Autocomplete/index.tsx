import { DisplayContext, getDisplayRestrictions, moderateProfile } from '@atcute/bluesky-moderation';

import { Autocomplete as BaseAutocomplete } from '@base-ui/react/autocomplete';

import { useModerationOpts } from '#/state/preferences/moderation-opts';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import type {
	AutocompleteEmoji,
	AutocompleteItem,
	AutocompleteProfile,
	Placement,
} from '#/components/Composer/Autocomplete/types';
import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';

import { m } from '#/paraglide/messages';

import * as styles from './Autocomplete.css';

/**
 * inline-autocomplete suggestion popup for mentions and emoji. must be rendered inside the composer's
 * `BaseAutocomplete.Root`.
 */
export function Autocomplete({
	items,
	getAnchor,
	placement = 'bottom',
	onSelect,
}: {
	items: AutocompleteItem[];
	getAnchor: () => Element | { getBoundingClientRect: () => DOMRect } | null;
	placement?: Placement;
	onSelect: (item: AutocompleteItem) => void;
}) {
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `Placement` is a fixed `side` or `side-align` union
	const [side, align = 'start'] = placement.split('-') as ['bottom' | 'top', 'end' | 'start' | undefined];

	return (
		<BaseAutocomplete.Portal>
			<BaseAutocomplete.Positioner
				anchor={getAnchor}
				align={align}
				className={styles.positioner}
				positionMethod="fixed"
				side={side}
				sideOffset={8}
			>
				<BaseAutocomplete.Popup
					className={styles.popup}
					// keep the textarea focused (and its selection intact) when a row is clicked.
					onMouseDown={(e) => e.preventDefault()}
				>
					{items.length === 0 ? (
						<CenteredSpinner label={m['common.status.loading']()} size="xl" />
					) : (
						<BaseAutocomplete.List>
							{items.map((item) => {
								switch (item.type) {
									case 'emoji':
										return <EmojiItem key={item.key} item={item} onSelect={onSelect} />;
									case 'profile':
										return <ProfileItem key={item.key} item={item} onSelect={onSelect} />;
									default:
										return null;
								}
							})}
						</BaseAutocomplete.List>
					)}
				</BaseAutocomplete.Popup>
			</BaseAutocomplete.Positioner>
		</BaseAutocomplete.Portal>
	);
}

// cloned 1:1 from the search autocomplete's ProfileRow; keep the two in sync.
function ProfileItem({
	item,
	onSelect,
}: {
	item: AutocompleteProfile;
	onSelect: (item: AutocompleteItem) => void;
}) {
	const moderationOpts = useModerationOpts();
	const moderation = moderationOpts
		? getDisplayRestrictions(moderateProfile(item.profile, moderationOpts), DisplayContext.ProfileMedia)
		: undefined;

	return (
		<BaseAutocomplete.Item className={styles.row} value={item} onClick={() => onSelect(item)}>
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
				<Text color="textContrastMedium" numberOfLines={1} size="md_sub">
					{item.profile.displayName || item.profile.handle}
				</Text>
			</span>
		</BaseAutocomplete.Item>
	);
}

function EmojiItem({
	item,
	onSelect,
}: {
	item: AutocompleteEmoji;
	onSelect: (item: AutocompleteItem) => void;
}) {
	return (
		<BaseAutocomplete.Item className={styles.row} value={item} onClick={() => onSelect(item)}>
			<Text className={styles.emojiGlyph}>{item.value}</Text>
			<Text>:{item.emoji.id}:</Text>
		</BaseAutocomplete.Item>
	);
}
