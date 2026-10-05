import { clsx } from 'clsx';

import { Text } from '#/components/Text';

import PlusIcon from '#/icons/central/PlusSmall_round_outlined_radius1_stroke2.svg';

import { NEW_POST_ZONE_ATTR } from '../shared/elements';
import * as css from './NewPostDropZone.css';

/**
 * drop zone for appending a post with the dragged media.
 *
 * @param props whether the current drag would land in the zone
 * @returns the zone
 */
export function NewPostDropZone({ isActive }: { isActive: boolean }) {
	return (
		<div className={clsx(css.root, isActive && css.active)} aria-hidden {...{ [NEW_POST_ZONE_ATTR]: '' }}>
			<div className={css.avatar}>
				<PlusIcon className={css.icon} />
			</div>
			<Text weight="medium" className={css.label}>
				Drop to add a new post
			</Text>
		</div>
	);
}
