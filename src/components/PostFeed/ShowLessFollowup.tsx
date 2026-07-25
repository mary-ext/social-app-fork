import { CircleCheck_Stroke2_Corner0_Rounded } from '#/components/icons/CircleCheck';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './ShowLessFollowup.css';

export function ShowLessFollowup({ topBorder = false }: { topBorder?: boolean }) {
	return (
		<div className={css.root({ topBorder })}>
			<div className={css.card}>
				<CircleCheck_Stroke2_Corner0_Rounded className={css.icon} fill={colors.contrast_500} size="md" />
				<Text className={css.text} color="textContrastHigh" size="md_sub">
					{m['view.posts.feedback.thanks']()}
				</Text>
			</div>
		</div>
	);
}
