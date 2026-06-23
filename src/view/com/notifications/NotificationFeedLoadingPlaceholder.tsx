import { useMemo } from 'react';
import { clsx } from 'clsx';

import { triangularRandom, weightedRandomIndex } from '#/lib/numbers';

import { Heart2_Filled_Stroke2_Corner0_Rounded as HeartIconFilled } from '#/components/icons/Heart2';
import * as Skele from '#/components/web/Skeleton';

import { colors } from '#/styles/colors';

import * as itemCss from './NotificationFeedItem.css';
import * as css from './NotificationFeedLoadingPlaceholder.css';

// weighted author-avatar counts (1–5, the real `MAX_AUTHORS` cap): aggregated notifications most often have
// a single author, so 1 dominates and larger stacks taper off. index + 1 = avatar count.
const AVATAR_WEIGHTS = [20, 10, 4, 2, 1];

// weighted tile counts for the subject's media strip: most liked posts are text-only, so 0 dominates, and
// among galleries smaller ones are far likelier than full four-ups. index = tile count (0–4).
const GALLERY_WEIGHTS = [20, 10, 4, 2, 1];

// weighted line counts for the subject-text preview: short posts are the norm, so a single line dominates
// and longer previews taper off. index + 1 = line count (1–3).
const SUBJECT_LINE_WEIGHTS = [4, 2, 1];

function NotificationLoadingPlaceholder({
	actionWidth,
	avatarCount,
	galleryCount,
	subjectLines,
	subjectWidth,
	topBorder,
}: {
	actionWidth: number;
	avatarCount: number;
	galleryCount: number;
	subjectLines: number;
	subjectWidth: number;
	topBorder: boolean;
}) {
	return (
		<div className={clsx(css.item, topBorder && css.itemTopBorder)}>
			<div className={itemCss.iconColumn}>
				<HeartIconFilled size="lg" fill={colors.contrast_50} />
			</div>
			<div className={itemCss.content}>
				<div className={css.avatars}>
					{Array.from({ length: avatarCount }, (_, i) => (
						<Skele.Circle key={i} size={itemCss.NOTIF_AVI_SIZE} />
					))}
				</div>
				<div className={itemCss.notifText}>
					<Skele.Text size="md" width={`${actionWidth}%`} />
				</div>
				<div className={itemCss.additionalWrap}>
					<Skele.Lines count={subjectLines} lastWidth={subjectWidth} size="md_sub" />
					{galleryCount > 0 ? (
						<div className={css.gallery}>
							{Array.from({ length: galleryCount }, (_, i) => (
								<div key={i} className={css.galleryTile} />
							))}
						</div>
					) : null}
				</div>
			</div>
		</div>
	);
}

export function NotificationFeedLoadingPlaceholder() {
	// freeze the per-row variety for the component's lifetime so it doesn't reshuffle on every re-render.
	const rows = useMemo(
		() =>
			Array.from({ length: 11 }, () => ({
				actionWidth: triangularRandom(40, 75, 5),
				avatarCount: 1 + weightedRandomIndex(AVATAR_WEIGHTS),
				galleryCount: weightedRandomIndex(GALLERY_WEIGHTS),
				subjectLines: 1 + weightedRandomIndex(SUBJECT_LINE_WEIGHTS),
				subjectWidth: triangularRandom(55, 95, 5),
			})),
		[],
	);

	return (
		<>
			{rows.map((row, i) => (
				<NotificationLoadingPlaceholder
					key={i}
					actionWidth={row.actionWidth}
					avatarCount={row.avatarCount}
					galleryCount={row.galleryCount}
					subjectLines={row.subjectLines}
					subjectWidth={row.subjectWidth}
					topBorder={i !== 0}
				/>
			))}
		</>
	);
}
