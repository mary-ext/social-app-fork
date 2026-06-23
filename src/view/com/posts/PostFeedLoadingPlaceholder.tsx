import { useMemo } from 'react';
import { assignInlineVars } from '@vanilla-extract/dynamic';

import { clamp, randomInRange, triangularRandom, weightedRandomIndex } from '#/lib/numbers';

import { Repost_Stroke2_Corner3_Rounded as RepostIcon } from '#/components/icons/Repost';
import * as imgCss from '#/components/ImageEmbed/AutoSizedImage.css';
import { MAX_ASPECT_RATIO, MIN_ASPECT_RATIO } from '#/components/ImageEmbed/carousel/const';
import { PostControlsSkeleton } from '#/components/PostControls';
import * as PostLayout from '#/components/PostLayout';
import * as Skele from '#/components/web/Skeleton';

import { colors } from '#/styles/colors';

import * as feedCss from './PostFeedItem.css';
import * as css from './PostFeedLoadingPlaceholder.css';
import * as reasonCss from './PostFeedReason.css';

// feed avatar size, matching `PostFeedItem`'s `PreviewableUserAvatar size={36}`.
const AVI_SIZE = 36;

// the carousel's desktop content height — `Gallery`'s `measureContentHeight` at viewport width >= 800px.
const CAROUSEL_HEIGHT = 300;

// the feed's single-image floor: aspects taller than 1:2 are clamped (`AutoSizedImage`'s `constrained`).
const SINGLE_MIN_ASPECT = 1 / 2;

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

type Embed = { aspect: number; type: 'single' } | { tiles: number[]; type: 'carousel' };

function randomEmbed(): Embed | null {
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

// mirrors `AutoSizedImage`'s constrained box: the `paddingTop` sets the box height, and the tile takes that
// height with `aspect-ratio`, so landscape fills the width while a portrait sits left-aligned and narrow.
function SingleImage({ aspect }: { aspect: number }) {
	const ratio = Math.max(aspect, SINGLE_MIN_ASPECT);
	const pad = `${Math.min(1 / ratio, 1) * 100}%`;
	return (
		<div className={css.single}>
			<div className={imgCss.sizer} style={assignInlineVars({ [imgCss.padVar]: pad })}>
				<div className={imgCss.abs}>
					<div className={css.singleTile} style={{ aspectRatio: ratio }} />
				</div>
			</div>
		</div>
	);
}

function PostLoadingPlaceholder({
	embed,
	lastLineWidth,
	reasonWidth,
	textLines,
	topBorder,
}: {
	embed: Embed | null;
	lastLineWidth: number;
	reasonWidth: number | null;
	textLines: number;
	topBorder: boolean;
}) {
	return (
		<PostLayout.Frame topBorder={topBorder}>
			{/* the real item always renders this reason row; even empty it reserves the post's top spacing, and
			    a repost/pin reason adds its own line */}
			<div className={feedCss.reasonRow}>
				<div className={feedCss.spineSlot} />
				<div className={feedCss.reason}>
					{reasonWidth != null ? (
						<div className={reasonCss.includeReason}>
							<RepostIcon fill={colors.contrast_50} width={13} height={13} />
							{/* fixed px, not a %: the real reason hugs its content, so a percentage has no stable base */}
							<Skele.Text blend size="md_sub" width={reasonWidth} />
						</div>
					) : null}
				</div>
			</div>
			<PostLayout.Row className={feedCss.layoutRow}>
				<PostLayout.AvatarColumn>
					<Skele.Circle size={AVI_SIZE} />
				</PostLayout.AvatarColumn>
				<PostLayout.ContentColumn>
					<div className={feedCss.metaSpacing}>
						<Skele.Row gap="xs">
							<Skele.Text size="md" width="25%" />
						</Skele.Row>
					</div>
					<Skele.Col>
						{Array.from({ length: textLines }, (_, i) => (
							// full-width lines with a partial last line, the way wrapped text fills the column
							<Skele.Text
								key={i}
								blend
								size="md"
								width={i === textLines - 1 ? `${lastLineWidth}%` : '100%'}
							/>
						))}
					</Skele.Col>
					{embed?.type === 'single' ? (
						<SingleImage aspect={embed.aspect} />
					) : embed?.type === 'carousel' ? (
						<div className={css.carousel} style={{ height: CAROUSEL_HEIGHT }}>
							{embed.tiles.map((aspect, i) => (
								<div
									key={i}
									className={css.carouselTile}
									style={{
										width: Math.floor(CAROUSEL_HEIGHT * clamp(aspect, MIN_ASPECT_RATIO, MAX_ASPECT_RATIO)),
									}}
								/>
							))}
						</div>
					) : null}
					<PostControlsSkeleton />
				</PostLayout.ContentColumn>
			</PostLayout.Row>
		</PostLayout.Frame>
	);
}

export function PostFeedLoadingPlaceholder() {
	// freeze the per-row variety for the component's lifetime so it doesn't reshuffle on every re-render.
	const rows = useMemo(
		() =>
			Array.from({ length: 9 }, () => ({
				embed: randomEmbed(),
				lastLineWidth: triangularRandom(35, 90, 5),
				// ~30% of rows carry a repost/pin reason line, sized in px to the "Reposted by …" handle's natural
				// width; null leaves the row empty (just its reserved space)
				reasonWidth: weightedRandomIndex([7, 3]) === 1 ? triangularRandom(110, 210, 10) : null,
				// post bodies cluster around a couple of lines; a triangular draw peaks there and tails to 1 and 5
				textLines: triangularRandom(1, 5),
			})),
		[],
	);

	return (
		<>
			{rows.map((row, i) => (
				<PostLoadingPlaceholder
					key={i}
					embed={row.embed}
					lastLineWidth={row.lastLineWidth}
					reasonWidth={row.reasonWidth}
					textLines={row.textLines}
					topBorder={i !== 0}
				/>
			))}
		</>
	);
}
