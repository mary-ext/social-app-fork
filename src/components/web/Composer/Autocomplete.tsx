import { type CSSProperties, useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { createPortal } from 'react-dom';

import { useKeyboardHandling } from '#/lib/sift/useKeyboardHandling';
import type { UseSiftReturn } from '#/lib/sift/useSift';
import type { TapperActiveFacet } from '#/lib/tapper';

import type { AutocompleteItem } from '#/components/Autocomplete/types';
import { useAutocomplete } from '#/components/Autocomplete/useAutocomplete';
import { parseAutocompleteItemType } from '#/components/Autocomplete/util';

import * as styles from './Autocomplete.css';

export function Autocomplete({
	sift,
	activeFacet,
	inverted,
	onDismiss,
}: {
	sift: UseSiftReturn;
	activeFacet: TapperActiveFacet;
	inverted?: boolean;
	onDismiss: () => void;
}) {
	const { items } = useAutocomplete({
		type: parseAutocompleteItemType(activeFacet.type),
		query: activeFacet.value,
	});

	// `:smile:` — once the user types the closing colon, commit the top emoji match.
	useEffect(() => {
		if (activeFacet.type === 'emoji' && !!activeFacet.value.length && activeFacet.raw.endsWith(':')) {
			if (items[0]) {
				activeFacet.replace(items[0].value, { noTrailingSpace: true });
				onDismiss();
			}
		}
	}, [items, activeFacet, onDismiss]);

	if (!items.length) {
		return null;
	}

	return (
		<List
			sift={sift}
			items={items}
			inverted={inverted}
			onSelect={(item) => {
				activeFacet.replace(item.value);
				onDismiss();
			}}
			onDismiss={onDismiss}
		/>
	);
}

function List({
	sift,
	items,
	inverted,
	onSelect,
	onDismiss,
}: {
	sift: UseSiftReturn;
	items: AutocompleteItem[];
	inverted?: boolean;
	onSelect: (item: AutocompleteItem) => void;
	onDismiss: () => void;
}) {
	const [activeIndex, setActiveIndex] = useState(0);

	// reset the highlight and reposition the popover whenever the result set changes. `sift.updatePosition`
	// is stable for the component's lifetime (a useCallback with [] deps in useSift), so it never churns the
	// subscription here. `useKeyboardHandling` keeps its own latest-callback ref, so the plain arrows below
	// need no stable identity.
	useEffect(() => {
		setActiveIndex(0);
		void sift.updatePosition();
	}, [items.length, sift.updatePosition]);

	const next = () => {
		if (items.length) setActiveIndex((i) => (i + 1) % items.length);
	};
	const prev = () => {
		if (items.length) setActiveIndex((i) => (i - 1 + items.length) % items.length);
	};
	const first = () => {
		if (items.length) setActiveIndex(0);
	};
	const last = () => {
		if (items.length) setActiveIndex(items.length - 1);
	};

	useKeyboardHandling({
		sift,
		onArrowDown: inverted ? prev : next,
		onArrowUp: inverted ? next : prev,
		onHome: inverted ? last : first,
		onEnd: inverted ? first : last,
		onSelect: () => onSelect(items[activeIndex]!),
		onDismiss,
	});

	const px = (v: number | string | undefined) => (typeof v === 'number' ? `${v}px` : v);
	// `computeStyles` only ever emits numbers / 'auto' / undefined; the RN ViewStyle type is wider.
	const ps = sift.popoverStyles as {
		bottom?: number | 'auto';
		left?: number;
		maxHeight?: number;
		maxWidth?: number;
		top?: number | 'auto';
	};
	const hasStyles = ps.top != null;
	const positionStyle: CSSProperties = {
		bottom: px(ps.bottom),
		left: px(ps.left),
		maxHeight: px(ps.maxHeight),
		maxWidth: px(ps.maxWidth),
		opacity: hasStyles ? 1 : 0,
		position: 'fixed',
		top: px(ps.top),
	};

	const rows = items.map((item, dataIndex) => ({ dataIndex, item }));
	const visual = inverted ? [...rows].reverse() : rows;

	return createPortal(
		<div
			ref={sift.refs.setPopover}
			role="listbox"
			id={sift.id}
			className={styles.popup}
			style={positionStyle}
			// keep the textarea focused (and the selection intact) when an item is clicked.
			onMouseDown={(e) => e.preventDefault()}
		>
			{visual.map(({ dataIndex, item }) => (
				<Row key={item.key} item={item} active={dataIndex === activeIndex} onSelect={() => onSelect(item)} />
			))}
		</div>,
		document.body,
	);
}

function Row({ item, active, onSelect }: { item: AutocompleteItem; active: boolean; onSelect: () => void }) {
	if (item.type === 'profile') {
		return (
			<button
				type="button"
				role="option"
				aria-selected={active}
				className={clsx(styles.item, styles.profileItem, active && styles.itemActive)}
				onClick={onSelect}
			>
				<img className={styles.avatar} src={item.profile.avatar} alt="" />
				<span className={styles.profileText}>
					<span className={styles.displayName}>{item.profile.displayName || item.profile.handle}</span>
					{/* eslint-disable-next-line bsky-internal/avoid-unwrapped-text -- styled <span>, not RN text */}
					<span className={styles.handle}>@{item.profile.handle}</span>
				</span>
			</button>
		);
	}
	if (item.type === 'emoji') {
		return (
			<button
				type="button"
				role="option"
				aria-selected={active}
				className={clsx(styles.item, styles.emojiItem, active && styles.itemActive)}
				onClick={onSelect}
			>
				<span className={styles.emojiGlyph}>{item.value}</span>
				{/* eslint-disable-next-line bsky-internal/avoid-unwrapped-text -- styled <span>, not RN text */}
				<span className={styles.emojiLabel}>:{item.emoji.id}:</span>
			</button>
		);
	}
	return null;
}
