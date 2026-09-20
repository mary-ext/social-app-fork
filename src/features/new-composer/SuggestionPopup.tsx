import { type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { DisplayContext, getDisplayRestrictions, moderateProfile } from '@atcute/bluesky-moderation';

import { createPortal } from 'react-dom';
import type { Wordgard } from 'wordgard/editor';

import { useModerationOpts } from '#/state/moderation/moderation-opts';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import type { AutocompleteItem } from '#/components/Composer/Autocomplete/types';
import { useAutocomplete } from '#/components/Composer/Autocomplete/useAutocomplete';
import { parseAutocompleteItemType } from '#/components/Composer/Autocomplete/util';
import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';

import { m } from '#/paraglide/messages';

import {
	type ActiveCompletion,
	acceptCompletion,
	getSuggestionOptionId,
	SUGGESTION_LISTBOX_ID,
	type SuggestionKeyHandler,
} from './autocomplete';
import * as styles from './SuggestionPopup.css';

/**
 * completion suggestions navigated through the editor's key handler, without taking focus.
 *
 * @param props the editor, completion, portal host, key handler ref, and popup callbacks
 * @returns the suggestion popup, or null when there are no results and no pending request
 */
export function SuggestionPopup({
	wg,
	completion,
	host,
	keyHandlerRef,
	onDismiss,
	onHighlightChange,
}: {
	wg: Wordgard;
	completion: ActiveCompletion;
	/** portal target positioned by the editor. */
	host: HTMLElement;
	keyHandlerRef: RefObject<SuggestionKeyHandler>;
	onDismiss: () => void;
	/** reports the highlighted row's DOM id, or null when none. */
	onHighlightChange: (optionId: string | null) => void;
}) {
	const { items, isFetching } = useAutocomplete({
		type: parseAutocompleteItemType(completion.type),
		query: completion.query,
	});

	// preserve the highlighted suggestion across result reordering.
	const [highlighted, setHighlighted] = useState<string | null>(null);
	const index = Math.max(
		items.findIndex((item) => item.key === highlighted),
		0,
	);

	const isOpen = items.length > 0 || isFetching;
	// useAutocomplete retains the previous query's results while fetching.
	const isStale = isFetching;

	const accept = (item: AutocompleteItem) => {
		return acceptCompletion(wg, completion, item.value);
	};

	const listRef = useRef<HTMLDivElement>(null);

	// the parent sets and clears the editor's active descendant, including on popup unmount.
	useEffect(() => {
		onHighlightChange(isOpen && items.length > 0 ? getSuggestionOptionId(index) : null);
	}, [onHighlightChange, isOpen, index, items.length]);

	// focus stays in the editor, so scroll the highlighted row manually.
	useLayoutEffect(() => {
		listRef.current
			?.querySelector(`#${CSS.escape(getSuggestionOptionId(index))}`)
			?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
	}, [index]);

	useLayoutEffect(() => {
		keyHandlerRef.current = (key) => {
			if (!isOpen) {
				return false;
			}

			switch (key) {
				case 'ArrowDown':
				case 'ArrowUp': {
					const step = key === 'ArrowDown' ? 1 : -1;
					const next = items[(index + step + items.length) % items.length];
					if (!next) {
						return false;
					}
					setHighlighted(next.key);
					return true;
				}
				case 'Enter':
				case 'Tab': {
					// consume acceptance keys while fetching; Enter must not split the post.
					if (isStale) {
						return true;
					}

					const item = items[index];
					if (!item) {
						return false;
					}
					return accept(item);
				}
				case 'Escape': {
					onDismiss();
					return true;
				}
			}
		};

		return () => {
			keyHandlerRef.current = () => false;
		};
	});

	if (!isOpen) {
		return null;
	}

	return createPortal(
		<div
			ref={listRef}
			id={SUGGESTION_LISTBOX_ID}
			role="listbox"
			className={styles.popup}
			// preserve the editor's focus and caret when clicking a suggestion.
			onMouseDown={(event) => event.preventDefault()}
		>
			{items.length === 0 ? (
				<CenteredSpinner label={m['common.status.loading']()} size="xl" />
			) : (
				items.map((item, i) => (
					<div
						key={item.key}
						id={getSuggestionOptionId(i)}
						role="option"
						aria-selected={i === index}
						data-highlighted={i === index ? '' : undefined}
						className={styles.row}
						onMouseEnter={() => setHighlighted(item.key)}
						onClick={() => accept(item)}
					>
						<SuggestionRow item={item} />
					</div>
				))
			)}
		</div>,
		host,
	);
}

function SuggestionRow({ item }: { item: AutocompleteItem }) {
	const moderationOpts = useModerationOpts();

	switch (item.type) {
		case 'profile': {
			const moderation = moderationOpts
				? getDisplayRestrictions(moderateProfile(item.profile, moderationOpts), DisplayContext.ProfileMedia)
				: undefined;

			return (
				<>
					<UserAvatar
						avatar={item.profile.avatar}
						className={styles.avatar}
						moderation={moderation}
						size={36}
						type={item.profile.associated?.labeler ? 'labeler' : 'user'}
					/>
					<span className={styles.profileText}>
						<Text numberOfLines={1} weight="medium">
							{item.profile.handle}
						</Text>
						{item.profile.displayName ? (
							<Text color="textContrastMedium" numberOfLines={1} size="md_sub">
								{item.profile.displayName}
							</Text>
						) : null}
					</span>
				</>
			);
		}
		case 'emoji': {
			return (
				<>
					<Text className={styles.emojiGlyph}>{item.value}</Text>
					<Text className={styles.emojiName}>{item.label}</Text>
				</>
			);
		}
		default: {
			return <Text>{item.value}</Text>;
		}
	}
}
