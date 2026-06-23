import { useMemo } from 'react';

import { triangularRandom, weightedRandomIndex } from '#/lib/numbers';

import { Repost_Stroke2_Corner3_Rounded as RepostIcon } from '#/components/icons/Repost';
import * as EmbedSkeleton from '#/components/Post/Embed/EmbedSkeleton';
import { PostControlsSkeleton } from '#/components/PostControls';
import * as PostLayout from '#/components/PostLayout';
import * as Skele from '#/components/web/Skeleton';

import { colors } from '#/styles/colors';

import * as feedCss from './PostFeedItem.css';
import * as reasonCss from './PostFeedReason.css';

// feed avatar size, matching `PostFeedItem`'s `PreviewableUserAvatar size={36}`.
const AVI_SIZE = 36;

function PostLoadingPlaceholder({
	embed,
	lastLineWidth,
	reasonWidth,
	textLines,
	topBorder,
}: {
	embed: EmbedSkeleton.Shape | null;
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
					<Skele.Lines count={textLines} lastWidth={lastLineWidth} size="md" />
					{embed ? <EmbedSkeleton.Reply shape={embed} /> : null}
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
				embed: EmbedSkeleton.randomShape(),
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
