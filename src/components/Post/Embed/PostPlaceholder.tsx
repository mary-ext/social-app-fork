import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon } from '#/components/icons/CircleInfo';
import { Text } from '#/components/Text';

import { colors } from '#/styles/colors';

import * as css from './PostPlaceholder.css';

export function PostPlaceholder({ children }: { children: React.ReactNode }) {
	return (
		<div className={css.outer}>
			<CircleInfoIcon className={css.icon} fill={colors.textContrastMedium} size="md" />

			<Text size="md" weight="medium" color="textContrastMedium">
				{children}
			</Text>
		</div>
	);
}
