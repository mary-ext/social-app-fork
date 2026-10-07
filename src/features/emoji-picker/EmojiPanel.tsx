import { useEffect, useMemo, useRef, useState } from 'react';

import { mapDefined } from '@mary/array-fns';

import { useQuery } from '@tanstack/react-query';

import { useConstant } from '#/lib/hooks/use-constant';

import {
	addRecentEmoji,
	setEmojiSkinTone,
	useEmojiSkinTone,
	getRecentEmojis,
} from '#/state/preferences/emoji';

import * as SearchField from '#/components/forms/SearchField';
import * as Autocomplete from '#/components/primitives/autocomplete';

import { m } from '#/paraglide/messages';

import { CategoryNav } from './components/CategoryNav';
import { EmojiGrid, type EmojiGridHandle } from './components/EmojiGrid';
import { PickerPlaceholder } from './components/PickerPlaceholder';
import { SkinToneButton } from './components/SkinToneButton';
import { type EmojiDataset, emojiDatasetQuery, type EmojiSearch, emojiSearchQuery } from './data';
import * as styles from './EmojiPanel.css';
import { buildEmojiLayout } from './layout';
import type { Emoji } from './types';

/**
 * renders the emoji picker panel.
 *
 * @param onEmojiSelect called with the selected emoji and whether Shift was held.
 */
export function EmojiPanel({ onEmojiSelect }: { onEmojiSelect: (emoji: Emoji, shiftHeld: boolean) => void }) {
	const { data } = useQuery(emojiDatasetQuery());
	const [query, setQuery] = useState('');
	const trimmed = query.trim();
	const { data: search, isPending: isSearchPending } = useQuery({
		...emojiSearchQuery(),
		enabled: trimmed !== '',
	});
	const skinTone = useEmojiSkinTone();
	// freeze recents while open so picks don't move the highlighted emoji.
	const recents = useConstant(getRecentEmojis);
	const [activeSection, setActiveSection] = useState<string | null>(null);
	const gridRef = useRef<EmojiGridHandle>(null);
	const pendingJump = useRef<string | null>(null);
	const isSearchLoading = trimmed !== '' && isSearchPending;

	// search changes reset the grid unless a pending category jump takes precedence.
	useEffect(() => {
		const jump = pendingJump.current;
		pendingJump.current = null;
		if (jump && !trimmed) {
			gridRef.current?.scrollToSection(jump);
		} else {
			gridRef.current?.scrollToTop();
		}
	}, [trimmed]);

	const model = useMemo(() => buildModel(data, search, trimmed, recents), [data, search, recents, trimmed]);

	if (!data) {
		return <PickerPlaceholder />;
	}

	const handleSelect = (index: number, shiftHeld: boolean) => {
		const id = data.ids[index]!;
		addRecentEmoji(id);
		onEmojiSelect({ id, native: data.nativeAt(index, skinTone) }, shiftHeld);
		if (!shiftHeld) {
			setQuery('');
		}
	};

	const handleJump = (key: string) => {
		if (query) {
			pendingJump.current = key;
			setQuery('');
		} else {
			gridRef.current?.scrollToSection(key);
		}
	};

	return (
		<Autocomplete.Root
			grid
			items={model.cells}
			onItemHighlighted={(_item, details) => {
				// mounted cells need the grid's scroll padding too.
				if (details.reason === 'keyboard' && details.index >= 0) {
					gridRef.current?.ensureVisible(details.index);
				}
			}}
			onItemPress={(index, { event }) => handleSelect(index, event.shiftKey)}
			onValueChange={setQuery}
			value={query}
		>
			<div className={styles.panel}>
				<div className={styles.searchRow}>
					<SearchField.Root className={styles.searchField}>
						<SearchField.Icon />
						<Autocomplete.Input
							render={
								<SearchField.Input autoFocus placeholder={m['components.emojiPicker.search.placeholder']()} />
							}
						/>
						<SearchField.Slot>
							<Autocomplete.Clear render={<SearchField.Clear label={m['common.search.action.clear']()} />} />
							{data.skinTones && <SkinToneButton onChange={setEmojiSkinTone} tone={skinTone} />}
						</SearchField.Slot>
					</SearchField.Root>
				</div>

				<Autocomplete.List className={styles.list}>
					<Autocomplete.Empty>
						{!isSearchLoading && (
							<div className={styles.empty}>{m['components.emojiPicker.search.empty']()}</div>
						)}
					</Autocomplete.Empty>

					<EmojiGrid
						cells={model.cells}
						dataset={data}
						layout={model.layout}
						onActiveSectionChange={setActiveSection}
						ref={gridRef}
						skinTone={skinTone}
					/>
				</Autocomplete.List>

				<CategoryNav active={activeSection} hasRecents={model.hasRecent} onJump={handleJump} />
			</div>
		</Autocomplete.Root>
	);
}

function buildModel(
	data: EmojiDataset | undefined,
	search: EmojiSearch | undefined,
	query: string,
	recents: readonly string[],
) {
	if (!data) {
		return { cells: [] as number[], hasRecent: false, layout: buildEmojiLayout([]) };
	}

	const recentIndices = mapDefined(recents, (id) => data.indexById.get(id));
	const hasRecent = recentIndices.length > 0;

	if (query) {
		const cells = search ? search(query) : [];
		return { cells, hasRecent, layout: buildEmojiLayout([{ count: cells.length, key: 'search' }]) };
	}

	const sections = hasRecent ? [{ indices: recentIndices, key: 'recent' }, ...data.sections] : data.sections;

	const cells = sections.flatMap((section) => section.indices);
	const layout = buildEmojiLayout(
		sections.map((section) => ({ count: section.indices.length, key: section.key, labeled: true })),
	);
	return { cells, hasRecent, layout };
}
