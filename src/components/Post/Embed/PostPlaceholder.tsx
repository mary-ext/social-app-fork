import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon } from '#/components/icons/CircleInfo';
import { Text } from '#/components/Text';

import * as css from './PostPlaceholder.css';

export function PostPlaceholder({ children }: { children: React.ReactNode }) {
	return (
		<div className={css.outer}>
			<span className={css.icon}>
				<CircleInfoIcon fill="currentColor" size="md" />
			</span>

			<Text size="md" weight="medium" color="textContrastMedium">
				{children}
			</Text>
		</div>
	);
}
