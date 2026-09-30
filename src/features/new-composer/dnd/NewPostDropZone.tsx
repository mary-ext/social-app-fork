import { clsx } from 'clsx';

import { Text } from '#/components/Text';

import PlusIcon from '#/icons/central/PlusSmall_round_outlined_radius1_stroke2.svg';

import { NEW_POST_ZONE_ATTR } from '../elements';
import * as styles from './NewPostDropZone.css';

/**
 * drop zone for appending a post with the dragged media.
 *
 * @param props whether the current drag would land in the zone
 * @returns the zone
 */
export function NewPostDropZone({ isActive }: { isActive: boolean }) {
	return (
		<div
			className={clsx(styles.root, isActive && styles.active)}
			aria-hidden
			{...{ [NEW_POST_ZONE_ATTR]: '' }}
		>
			<div className={styles.avatar}>
				<PlusIcon className={styles.icon} />
			</div>
			<Text weight="medium" className={styles.label}>
				Drop to add a new post
			</Text>
		</div>
	);
}
