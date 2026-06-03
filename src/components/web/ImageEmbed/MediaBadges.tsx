import { Trans } from '@lingui/react/macro';

import * as styles from '#/components/web/ImageEmbed/MediaBadges.css';
import { Text } from '#/components/web/Text';

// app.bsky icon `ArrowsDiagonalOut_Stroke2_Corner0_Rounded`, inlined as DOM SVG.
const FULLSCREEN_PATH =
	'M14 5a1 1 0 1 1 0-2h6a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V6.414l-4.293 4.293a1 1 0 0 1-1.414-1.414L17.586 5H14ZM4 13a1 1 0 0 1 1 1v3.586l4.293-4.293a1 1 0 0 1 1.414 1.414L6.414 19H10a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1Z';

export type MediaBadgesProps = {
	variant: 'gallery' | 'single';
	hasAlt: boolean;
	cropped: boolean;
	large: boolean;
};

/** Bottom-right overlay badges on a media thumbnail: a fullscreen indicator when cropped, and an ALT tag. */
export function MediaBadges({ variant, hasAlt, cropped, large }: MediaBadgesProps) {
	if (!hasAlt && !cropped) {
		return null;
	}

	const boxClass =
		variant === 'single'
			? large
				? styles.box.singleLarge
				: styles.box.singleRegular
			: large
				? styles.box.galleryLarge
				: styles.box.galleryRegular;
	const iconSize = large ? 18 : 12;

	return (
		<div aria-hidden className={large ? styles.cluster.large : styles.cluster.regular}>
			{cropped && (
				<div className={boxClass}>
					<svg
						className={styles.icon}
						width={iconSize}
						height={iconSize}
						viewBox="0 0 24 24"
						fill="currentColor"
					>
						<path d={FULLSCREEN_PATH} />
					</svg>
				</div>
			)}
			{hasAlt && (
				<div className={boxClass}>
					<Text weight="bold" size={large ? 'xs' : 'sm'} className={large ? undefined : styles.altSmall}>
						<Trans>ALT</Trans>
					</Text>
				</div>
			)}
		</div>
	);
}
