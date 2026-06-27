import { useEffect, useMemo, useRef, useState } from 'react';
import { Autocomplete } from '@base-ui/react/autocomplete';
import type { Emoji as DataEmoji } from '@emoji-mart/data';
import { useQuery } from '@tanstack/react-query';

import { definite } from '#/lib/functions';

import { m } from '#/paraglide/messages';
import { type SkinTone, useEmojiSkinTone, useRecentEmojis } from '#/storage/hooks/emoji';

import { CategoryNav } from './components/CategoryNav';
import { EmojiGrid, type EmojiGridHandle } from './components/EmojiGrid';
import { PickerPlaceholder } from './components/PickerPlaceholder';
import { SearchBar } from './components/SearchBar';
import { SkinToneButton } from './components/SkinToneButton';
import { type EmojiData, emojiDataQuery } from './data';
import * as styles from './EmojiPanel.css';
import { buildEmojiLayout } from './layout';
import type { Emoji } from './types';
import { type EmojiCell, makeCell, toSelection } from './util';

/**
 * the emoji picker panel: a searchable Base UI Autocomplete grid with a category nav, a skin-tone selector,
 * and a recently-used section. reports each selection plus whether Shift was held.
 */
export function EmojiPanel({ onEmojiSelect }: { onEmojiSelect: (emoji: Emoji, shiftHeld: boolean) => void }) {
	const { data } = useQuery(emojiDataQuery());
	const [query, setQuery] = useState('');
	const [skinTone, setSkinTone] = useEmojiSkinTone();
	const [recents, addRecent] = useRecentEmojis();
	const [activeSection, setActiveSection] = useState<string | null>(null);
	const gridRef = useRef<EmojiGridHandle>(null);
	const pendingJump = useRef<string | null>(null);

	// a category jump made while searching has to clear the query first; once the category layout is back,
	// scroll to the requested section (child layout effects run before this, so the jump wins the scroll reset).
	useEffect(() => {
		if (!query && pendingJump.current) {
			gridRef.current?.scrollToSection(pendingJump.current);
			pendingJump.current = null;
		}
	}, [query]);

	const model = useMemo(() => buildModel(data, query, skinTone, recents), [data, query, recents, skinTone]);

	if (!data) {
		return <PickerPlaceholder />;
	}

	const handleSelect = (cell: EmojiCell, shiftHeld: boolean) => {
		addRecent(cell.emoji.id);
		onEmojiSelect(toSelection(cell.emoji, skinTone), shiftHeld);
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
			filter={null}
			grid
			inline
			items={model.cells}
			itemToStringValue={(cell: EmojiCell) => cell.emoji.id}
			onItemHighlighted={(_item, details) => {
				if (details.reason === 'keyboard' && details.index >= 0) {
					gridRef.current?.ensureVisible(details.index);
				}
			}}
			onValueChange={(value, details) => {
				if (details.reason !== 'item-press') {
					setQuery(value);
				}
			}}
			open
			value={query}
			virtualized
		>
			<div className={styles.panel}>
				<SearchBar>
					<SkinToneButton onChange={setSkinTone} tone={skinTone} />
				</SearchBar>

				<Autocomplete.List className={styles.list}>
					<Autocomplete.Empty>
						{}
						<div className={styles.empty}>{m['components.emojiPicker.search.empty']()}</div>
					</Autocomplete.Empty>

					<EmojiGrid
						cells={model.cells}
						layout={model.layout}
						onActiveSectionChange={setActiveSection}
						onSelect={handleSelect}
						ref={gridRef}
					/>
				</Autocomplete.List>

				<CategoryNav active={activeSection} hasRecents={model.hasRecent} onJump={handleJump} />
			</div>
		</Autocomplete.Root>
	);
}

/**
 * builds the renderable cells and virtualization layout for the current query and tone, plus whether a recent
 * section exists.
 */
function buildModel(data: EmojiData | undefined, query: string, skinTone: SkinTone, recents: string[]) {
	if (!data) {
		return { cells: [] as EmojiCell[], hasRecent: false, layout: buildEmojiLayout([]) };
	}

	const recentEmojis = recents.length ? resolve(data, recents) : [];
	const hasRecent = recentEmojis.length > 0;

	const trimmed = query.trim();
	if (trimmed) {
		const cells = data.search(trimmed).map((emoji) => makeCell(emoji, skinTone, 'search'));
		return { cells, hasRecent, layout: buildEmojiLayout([{ count: cells.length, key: 'search' }]) };
	}

	const sections: { emojis: DataEmoji[]; key: string }[] = [];
	if (hasRecent) {
		sections.push({ emojis: recentEmojis, key: 'recent' });
	}
	for (const category of data.categories) {
		sections.push({ emojis: resolve(data, category.emojis), key: category.id });
	}

	const cells = sections.flatMap((section) =>
		section.emojis.map((emoji) => makeCell(emoji, skinTone, section.key)),
	);
	const layout = buildEmojiLayout(
		sections.map((section) => ({ count: section.emojis.length, key: section.key, labeled: true })),
	);
	return { cells, hasRecent, layout };
}

/** maps emoji ids to dataset emoji, dropping any unknown ids. */
function resolve(data: EmojiData, ids: string[]): DataEmoji[] {
	return definite(ids.map((id) => data.emojis[id]));
}
