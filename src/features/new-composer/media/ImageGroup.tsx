import { type FocusEvent, useLayoutEffect, useRef } from 'react';

import { CAROUSEL_MAX_HEIGHT, CAROUSEL_MIN_HEIGHT } from '#/components/ImageEmbed/carousel/const';
import { PagingControls } from '#/components/ImageEmbed/carousel/PagingControls';
import { getStripStyle } from '#/components/ImageEmbed/carousel/strip';
import { scrollToTile } from '#/components/ImageEmbed/carousel/tiles';
import { getAspectRatio } from '#/components/ImageEmbed/carousel/utils';

import { space } from '#/styles/tokens.css';

import { useEditorState } from '../context';
import { getDropSlot, getMediaDrag } from '../dnd/drop-indicators';
import type { ImageMedia } from '../model/schema';
import { keepEditorFocus } from '../shared/editor-focus';
import { IMAGE_GROUP_ATTR, MEDIA_ID_ATTR } from '../shared/elements';
import { RAIL_WIDTH } from '../shared/layout';
import type { RovingFocus } from '../shared/roving-focus';
import { type EditableImage, getEditedImage, getImageEdits, isEditableImage } from './image-edits';
import * as css from './ImageGroup.css';
import { ImageTile } from './ImageTile';

// the single-image layout has no gap; space its drop line as the strip would.
const getGap = (value: string) => {
	const gap = parseFloat(value);
	return Number.isNaN(gap) || gap === 0 ? space.xs : gap;
};

const placeDropLine = (group: HTMLElement, line: HTMLElement, slot: number): void => {
	const tiles = [...group.querySelectorAll<HTMLElement>(`[${MEDIA_ID_ATTR}]`)];
	const prev = tiles[slot - 1];
	const next = tiles[slot];
	const gap = getGap(getComputedStyle(group).columnGap);
	const thickness = css.DROP_LINE_THICKNESS;

	const place = (tile: HTMLElement, x: number) => {
		Object.assign(line.style, {
			left: `${x - thickness / 2}px`,
			top: `${tile.offsetTop}px`,
			width: `${thickness}px`,
			height: `${tile.offsetHeight}px`,
		});
	};

	if (next && prev) {
		place(next, (prev.offsetLeft + prev.offsetWidth + next.offsetLeft) / 2);
	} else if (next) {
		place(next, next.offsetLeft - gap / 2);
	} else if (prev) {
		place(prev, prev.offsetLeft + prev.offsetWidth + gap / 2);
	}
};

const onStripFocus = (event: FocusEvent<HTMLDivElement>) => {
	const el = event.currentTarget;
	const tile = event.target;
	// mandatory snapping can undo native focus scrolling.
	// leave pointer-focused tiles in place for dragging.
	if (tile instanceof HTMLElement && tile.parentElement === el && tile.matches(':focus-visible')) {
		scrollToTile({ el, scrollPaddingLeft: RAIL_WIDTH, tile });
	}
};

/**
 * reorderable images using the feed's single-image or carousel layout.
 *
 * @param props post images and interaction controls; images must start at media index 0
 * @returns the image group
 */
export function ImageGroup({
	postId,
	images,
	roving,
	onEditAlt,
	onEditImage,
	onRemove,
}: {
	postId: string;
	images: readonly ImageMedia[];
	roving: RovingFocus<string>;
	onEditAlt: (item: ImageMedia) => void;
	onEditImage: (item: EditableImage) => void;
	onRemove: (item: ImageMedia) => void;
}) {
	const dropSlot = useEditorState((state) => getDropSlot(getMediaDrag(state), postId));
	const edits = useEditorState(getImageEdits);
	const scrollRef = useRef<HTMLDivElement>(null);
	const lineRef = useRef<HTMLDivElement>(null);
	const layout = images.length === 1 ? 'single' : 'strip';

	// remeasure every render to track tile changes during a drag.
	useLayoutEffect(() => {
		if (scrollRef.current && lineRef.current && dropSlot !== null) {
			placeDropLine(scrollRef.current, lineRef.current, dropSlot);
		}
	});

	const group = (
		<div
			ref={scrollRef}
			tabIndex={layout === 'strip' ? -1 : undefined}
			className={layout === 'single' ? css.single : css.stripScroll}
			{...{ [IMAGE_GROUP_ATTR]: '' }}
			onFocus={layout === 'strip' ? onStripFocus : undefined}
		>
			{images.map((item, index) => (
				<ImageTile
					key={item.id}
					postId={postId}
					index={index}
					item={item}
					layout={layout}
					roving={roving.item(item.id)}
					onEditAlt={() => onEditAlt(item)}
					onEditImage={isEditableImage(item) ? () => onEditImage(item) : undefined}
					onRemove={() => onRemove(item)}
				/>
			))}
			{/* mounted only during drags, since carousel paging treats every child as a tile. */}
			{dropSlot !== null && <div ref={lineRef} className={css.dropLine} aria-hidden />}
		</div>
	);

	if (layout === 'single') {
		return group;
	}

	return (
		<div
			className={css.stripRoot}
			style={getStripStyle({
				max: CAROUSEL_MAX_HEIGHT,
				min: CAROUSEL_MIN_HEIGHT,
				ratios: images.map((item) => {
					return getAspectRatio(getEditedImage(item, edits.get(item.id) ?? null).dimensions);
				}),
			})}
		>
			{group}
			<div className={css.paging} onMouseDown={keepEditorFocus}>
				<PagingControls scrollPaddingLeft={RAIL_WIDTH} scrollRef={scrollRef} />
			</div>
		</div>
	);
}
