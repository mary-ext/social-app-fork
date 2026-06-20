import { assignInlineVars } from '@vanilla-extract/dynamic';

import { Play_Filled_Corner0_Rounded as PlayIcon } from '#/components/icons/Play';
import * as styles from '#/components/PlayButtonIcon.css';

/** The circular play affordance overlaid on inactive video/GIF/player embeds. */
export function PlayButtonIcon({ size = 32 }: { size?: number }) {
	return (
		<span className={styles.wrap} style={assignInlineVars({ [styles.sizeVar]: `${size}px` })}>
			<span className={styles.circle} />
			<PlayIcon className={styles.icon} width={size} fill="currentColor" />
		</span>
	);
}
