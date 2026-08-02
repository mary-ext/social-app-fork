import { Text } from '#/components/Text';

import FilterTimeline from '#/icons/central/FilterTimeline_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as css from './FollowingFeedCard.css';

export function FollowingFeedCard() {
	return (
		<div className={css.card}>
			<div className={css.icon}>
				<FilterTimeline className={css.filterTimelineIcon} />
			</div>
			<Text weight="medium">{m['common.follow.action.following']()}</Text>
		</div>
	);
}
