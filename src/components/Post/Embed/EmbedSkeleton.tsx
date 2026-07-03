import { randomInRange, weightedRandomIndex } from '#/lib/numbers';

import { CAROUSEL_MAX_HEIGHT, CAROUSEL_MIN_HEIGHT } from '#/components/ImageEmbed/carousel/const';
import { clampAspectRatio, deriveCarouselHeight } from '#/components/ImageEmbed/carousel/utils';
import { MAX_MEDIA_HEIGHT } from '#/components/Post/Embed/media-constants';

import * as css from './EmbedSkeleton.css';

/** A frozen media-embed shape for a loading placeholder: one image at some aspect, or a multi-image carousel. */
export type Shape = { aspect: number; type: 'single' } | { tiles: number[]; type: 'carousel' };

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
 * returns a randomly selected embed shape (single-image, carousel, or null) to simulate a realistic feed
 * placeholder. freeze the result (e.g., using `useMemo`) to prevent reshuffling on re-renders.
 *
 * @returns a shape type, or null approximately 60% of the time.
 */
export function randomShape(): Shape | null {
	switch (weightedRandomIndex(EMBED_KIND_WEIGHTS)) {
		case 1:
			return { aspect: randomAspect(), type: 'single' };
		case 2:
			return {
				// draw raw aspects (the tiles clamp their own width): the first two drive the row height, and
				// real landscape/portrait sets routinely sit past the clamp limits, so drawing within them would
				// peg every placeholder to the tallest bucket.
				tiles: Array.from({ length: 2 + weightedRandomIndex(CAROUSEL_COUNT_WEIGHTS) }, randomAspect),
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
	{ tiles: [1.6, 1.5, 0.8, 1.2], type: 'carousel' },
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
	// mirrors `AutoSizedImage`'s constrained box: the tile keeps its ratio but caps at `MAX_MEDIA_HEIGHT`, so
	// landscape fills the width while a portrait sits left-aligned and narrow.
	return (
		<div
			className={css.singleTile}
			style={{ aspectRatio: aspect, width: `min(100%, calc(${MAX_MEDIA_HEIGHT}px * ${aspect}))` }}
		/>
	);
}

function BleedSingle({ aspect }: { aspect: number }) {
	// the anchor's uncropped (`crop="none"`) path: one full-width box owning the image's own aspect ratio.
	return <div className={css.singleTile} style={{ aspectRatio: aspect, width: '100%' }} />;
}

function CarouselStrip({ tiles }: { tiles: number[] }) {
	// a strip at the carousel's derived row height, each tile as wide as its clamped aspect, clipped to the
	// column like the real one.
	const height = deriveCarouselHeight({
		max: CAROUSEL_MAX_HEIGHT,
		min: CAROUSEL_MIN_HEIGHT,
		ratios: tiles,
	});
	return (
		<div className={css.carousel} style={{ height }}>
			{tiles.map((aspect, i) => (
				<div
					key={i}
					className={css.carouselTile}
					style={{ width: Math.floor(height * clampAspectRatio(aspect)) }}
				/>
			))}
		</div>
	);
}

/**
 * Media-embed placeholder on a reply row (feed/linear/tree): a single image keeps its ratio, height-capped
 * (constrained crop).
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

/**
 * Media-embed placeholder on the focused anchor post: a single image keeps its ratio at full width
 * (uncropped).
 */
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
