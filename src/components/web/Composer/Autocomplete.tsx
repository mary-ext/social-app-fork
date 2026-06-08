import { type CSSProperties, useCallback, useEffect, useRef, useState } from 'react';
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
	const activeIndexRef = useRef(0);
	activeIndexRef.current = activeIndex;
	const lenRef = useRef(items.length);
	lenRef.current = items.length;
	const onSelectRef = useRef(onSelect);
	onSelectRef.current = onSelect;
	const updateRef = useRef(sift.updatePosition);
	updateRef.current = sift.updatePosition;

	useEffect(() => {
		setActiveIndex(0);
		updateRef.current();
	}, [items.length]);

	const next = useCallback(() => {
		if (lenRef.current) setActiveIndex((i) => (i + 1) % lenRef.current);
	}, []);
	const prev = useCallback(() => {
		if (lenRef.current) setActiveIndex((i) => (i - 1 + lenRef.current) % lenRef.current);
	}, []);
	const first = useCallback(() => {
		if (lenRef.current) setActiveIndex(0);
	}, []);
	const last = useCallback(() => {
		if (lenRef.current) setActiveIndex(lenRef.current - 1);
	}, []);

	useKeyboardHandling({
		sift,
		onArrowDown: inverted ? prev : next,
		onArrowUp: inverted ? next : prev,
		onHome: inverted ? last : first,
		onEnd: inverted ? first : last,
		onSelect: () => onSelectRef.current(items[activeIndexRef.current]!),
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
				<Row
					key={item.key}
					item={item}
					active={dataIndex === activeIndex}
					onSelect={() => onSelectRef.current(item)}
				/>
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
