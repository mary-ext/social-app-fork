import { assignInlineVars } from '@vanilla-extract/dynamic';

import * as styles from '#/components/PlayButtonIcon.css';

import PlayIcon from '#/icons/central/Play_round_filled_radius1_stroke2.svg';

/** The circular play affordance overlaid on inactive video/GIF/player embeds. */
export function PlayButtonIcon({ size = 32 }: { size?: number }) {
	return (
		<span className={styles.wrap} style={assignInlineVars({ [styles.sizeVar]: `${size}px` })}>
			<span className={styles.circle} />
			<PlayIcon className={styles.icon} width={size} height={size} />
		</span>
	);
}
