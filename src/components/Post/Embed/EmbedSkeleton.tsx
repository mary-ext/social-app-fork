import { assignInlineVars } from '@vanilla-extract/dynamic';

import { clamp, randomInRange, weightedRandomIndex } from '#/lib/numbers';

import * as imgCss from '#/components/ImageEmbed/AutoSizedImage.css';
import { MAX_ASPECT_RATIO, MIN_ASPECT_RATIO } from '#/components/ImageEmbed/carousel/const';

import * as css from './EmbedSkeleton.css';

/** A frozen media-embed shape for a loading placeholder: one image at some aspect, or a multi-image carousel. */
export type Shape = { aspect: number; type: 'single' } | { tiles: number[]; type: 'carousel' };

// the carousel's desktop content height — `Gallery`'s `measureContentHeight` at viewport width >= 800px.
const CAROUSEL_HEIGHT = 300;

// single-image aspect floors per surface: a reply clamps to 1:2 (`AutoSizedImage` constrained crop), the
// anchor to 1:4 (its uncropped `crop="none"` path).
const REPLY_MIN_ASPECT = 1 / 2;
const ANCHOR_MIN_ASPECT = 1 / 4;

// embed kind per post: none dominates, then a single image, then a multi-image carousel.
const EMBED_KIND_WEIGHTS = [6, 3, 1];
// carousel image count (2–6); only the first couple are on-screen, the rest are clipped, so the tail is cheap.
const CAROUSEL_COUNT_WEIGHTS = [4, 3, 2, 1, 1];

// log-uniform draw, so portrait and landscape are mirror-likely and 1:1 sits at the center of the span.
const logAspect = (min: number, max: number) => Math.exp(randomInRange(Math.log(min), Math.log(max)));

// a post image's aspect ratio. mostly moderate, but a tenth of the time it goes wild — real feeds carry the
// occasional meme banner or full-height screenshot (a 250:37 sliver is a genuine thing people post), and
// snapping to "known" ratios would hide that chaos.
const randomAspect = () => (weightedRandomIndex([9, 1]) === 1 ? logAspect(1 / 5, 7) : logAspect(1 / 2, 2));

/**
 * A randomly-drawn embed shape (or `null` for a text-only post), for a placeholder with many rows where the
 * variety reads as a real feed. Freeze it (e.g. `useMemo`) so it doesn't reshuffle across re-renders.
 *
 * @returns a single-image or carousel shape, or `null` ~60% of the time.
 */
export function randomShape(): Shape | null {
	switch (weightedRandomIndex(EMBED_KIND_WEIGHTS)) {
		case 1:
			return { aspect: randomAspect(), type: 'single' };
		case 2:
			return {
				// the carousel clamps every tile to [2/3, 3/2], so draw within those bounds directly
				tiles: Array.from({ length: 2 + weightedRandomIndex(CAROUSEL_COUNT_WEIGHTS) }, () =>
					logAspect(MIN_ASPECT_RATIO, MAX_ASPECT_RATIO),
				),
				type: 'carousel',
			};
		default:
			return null;
	}
}

// per-index embed shapes for thread reply skeletons: mostly none, then a single image, with the odd carousel —
// the same mix `randomShape` draws, but a fixed table. these skeletons render unmemoized, so a deterministic
// pick keeps each row stable across re-renders where a random draw would reshuffle and flicker.
const THREAD_SHAPES: (Shape | null)[] = [
	null,
	{ aspect: 1.6, type: 'single' },
	null,
	null,
	{ aspect: 0.75, type: 'single' },
	null,
	{ tiles: [1.3, 0.9, 1.5, 1.1], type: 'carousel' },
	null,
];

/**
 * The frozen embed shape a thread reply skeleton at {@link index} renders.
 *
 * @param index the reply's position in the thread list.
 * @returns a single-image or carousel shape, or `null` for a text-only row.
 */
export const threadShape = (index: number): Shape | null =>
	THREAD_SHAPES[index % THREAD_SHAPES.length] ?? null;

function ConstrainedSingle({ aspect }: { aspect: number }) {
	// mirrors `AutoSizedImage`'s constrained box: `paddingTop` sets the height and the tile takes it via
	// `aspect-ratio`, so landscape fills the width while a portrait sits left-aligned and narrow.
	const ratio = Math.max(aspect, REPLY_MIN_ASPECT);
	const pad = `${Math.min(1 / ratio, 1) * 100}%`;
	return (
		<div className={imgCss.sizer} style={assignInlineVars({ [imgCss.padVar]: pad })}>
			<div className={imgCss.abs}>
				<div className={css.constrainedTile} style={{ aspectRatio: ratio }} />
			</div>
		</div>
	);
}

function BleedSingle({ aspect }: { aspect: number }) {
	// the anchor's uncropped (`crop="none"`) path: one full-width box owning the 1:4-clamped aspect ratio.
	return <div className={css.bleedTile} style={{ aspectRatio: Math.max(aspect, ANCHOR_MIN_ASPECT) }} />;
}

function CarouselStrip({ tiles }: { tiles: number[] }) {
	// a fixed-height strip of tiles, each as wide as its clamped aspect, clipped to the column like the real one.
	return (
		<div className={css.carousel} style={{ height: CAROUSEL_HEIGHT }}>
			{tiles.map((aspect, i) => (
				<div
					key={i}
					className={css.carouselTile}
					style={{ width: Math.floor(CAROUSEL_HEIGHT * clamp(aspect, MIN_ASPECT_RATIO, MAX_ASPECT_RATIO)) }}
				/>
			))}
		</div>
	);
}

/**
 * Media-embed placeholder on a reply row (feed/linear/tree): a single image is 1:2-clamped (constrained
 * crop).
 */
export function Reply({ shape }: { shape: Shape }) {
	if (shape.type === 'carousel') {
		return <CarouselStrip tiles={shape.tiles} />;
	}
	return (
		<div className={css.single}>
			<ConstrainedSingle aspect={shape.aspect} />
		</div>
	);
}

/** Media-embed placeholder on the focused anchor post: a single image is 1:4-clamped (uncropped full-bleed). */
export function Anchor({ shape }: { shape: Shape }) {
	if (shape.type === 'carousel') {
		return <CarouselStrip tiles={shape.tiles} />;
	}
	return (
		<div className={css.single}>
			<BleedSingle aspect={shape.aspect} />
		</div>
	);
}
