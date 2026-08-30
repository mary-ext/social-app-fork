import type { ReactNode } from 'react';

import { Text } from '#/components/Text';

import CircleInfoIcon from '#/icons/central/CircleInfo_round_outlined_radius1_stroke2.svg';

import * as css from './PostPlaceholder.css';

export function PostPlaceholder({ children, trailing }: { children: ReactNode; trailing?: ReactNode }) {
	return (
		<div className={css.outer}>
			<CircleInfoIcon className={css.icon} />
			<Text size="md" weight="medium" color="textContrastMedium">
				{children}
			</Text>

			{trailing ? <div className={css.trailing}>{trailing}</div> : null}
		</div>
	);
}
