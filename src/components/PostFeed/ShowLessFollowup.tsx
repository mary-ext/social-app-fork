import { Text } from '#/components/Text';

import CircleCheck_Stroke2_Corner0_Rounded from '#/icons/central/CircleCheck_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as css from './ShowLessFollowup.css';

export function ShowLessFollowup({ topBorder = false }: { topBorder?: boolean }) {
	return (
		<div className={css.root({ topBorder })}>
			<div className={css.card}>
				<CircleCheck_Stroke2_Corner0_Rounded className={css.icon} />
				<Text className={css.text} color="textContrastHigh" size="md_sub">
					{m['view.posts.feedback.thanks']()}
				</Text>
			</div>
		</div>
	);
}
