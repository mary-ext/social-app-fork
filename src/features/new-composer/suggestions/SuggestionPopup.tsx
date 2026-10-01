import { type RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { DisplayContext, getDisplayRestrictions, moderateProfile } from '@atcute/bluesky-moderation';

import { createPortal } from 'react-dom';

import { useModerationOpts } from '#/state/moderation/moderation-opts';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import type { AutocompleteItem } from '#/components/Composer/Autocomplete/types';
import { useAutocomplete } from '#/components/Composer/Autocomplete/useAutocomplete';
import { parseAutocompleteItemType } from '#/components/Composer/Autocomplete/util';
import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';

import { m } from '#/paraglide/messages';

import { useComposer, useEditor, useEditorState } from '../context';
import { useStore } from '../store';
import {
	type ActiveCompletion,
	acceptCompletion,
	activeCompletion,
	getSuggestionOptionId,
	markSuggestionState,
	SUGGESTION_LISTBOX_ID,
	type SuggestionKeyHandler,
} from './autocomplete';
import * as styles from './SuggestionPopup.css';

const SPINNER_DELAY_MS = 200;

const getCompletionKey = (completion: ActiveCompletion) => {
	return `${completion.type}:${completion.from}:${completion.query}`;
};

/**
 * suggestions for the completion at the focused editor's caret.
 *
 * @returns the suggestion popup, or null when closed
 */
export function Suggestions() {
	const { wg, suggestionHost, suggestionKeys } = useComposer();
	const host = useStore(suggestionHost);
	const completion = useEditorState((state) => (wg.hasFocus ? state.field(activeCompletion) : null));

	// keep dismissed suggestions closed until the query changes.
	const [dismissed, setDismissed] = useState<string | null>(null);

	let open: ActiveCompletion | null = null;
	if (
		completion &&
		// hashtags have no suggestion source yet.
		completion.type !== 'tag' &&
		completion.query !== '' &&
		getCompletionKey(completion) !== dismissed
	) {
		open = completion;
	}

	// clear on close; unmount cleanup may run after the editor is detached.
	useEffect(() => {
		if (!open) {
			markSuggestionState(wg, { anchor: null, activeOption: null });
		}
	}, [wg, open]);

	if (!open) {
		return null;
	}

	return (
		<SuggestionPopup
			completion={open}
			host={host}
			keyHandlerRef={suggestionKeys}
			onDismiss={() => setDismissed(getCompletionKey(open))}
		/>
	);
}

// keyboard navigation runs through the editor so the popup doesn't take focus.
function SuggestionPopup({
	completion,
	host,
	keyHandlerRef,
	onDismiss,
}: {
	completion: ActiveCompletion;
	/** editor-positioned portal target; null until anchored. */
	host: HTMLElement | null;
	keyHandlerRef: RefObject<SuggestionKeyHandler>;
	onDismiss: () => void;
}) {
	const wg = useEditor();
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

	// delay the spinner to avoid flicker on fast responses.
	const pendingQuery = isFetching && items.length === 0 ? completion.query : null;
	const [slowQuery, setSlowQuery] = useState<string | null>(null);
	useEffect(() => {
		if (pendingQuery === null) {
			return;
		}

		const timer = setTimeout(() => setSlowQuery(pendingQuery), SPINNER_DELAY_MS);
		return () => {
			clearTimeout(timer);
			// reset the delay for refetches of the same query.
			setSlowQuery(null);
		};
	}, [pendingQuery]);

	const isOpen = items.length > 0 || (pendingQuery !== null && pendingQuery === slowQuery);
	// useAutocomplete retains the previous query's results while fetching.
	const isStale = isFetching;

	const accept = (item: AutocompleteItem) => {
		return acceptCompletion(wg, completion, item.value);
	};

	const listRef = useRef<HTMLDivElement>(null);

	// leave aria-controls unset when the listbox is hidden.
	useEffect(() => {
		markSuggestionState(wg, {
			anchor: isOpen ? completion.from : null,
			activeOption: isOpen && items.length > 0 ? getSuggestionOptionId(index) : null,
		});
	}, [wg, isOpen, completion.from, index, items.length]);

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

	if (!isOpen || !host) {
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
