import { FilterTimeline_Stroke2_Corner0_Rounded as FilterTimeline } from '#/components/icons/FilterTimeline';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './FollowingFeedCard.css';

export function FollowingFeedCard() {
	return (
		<div className={css.card}>
			<div className={css.icon}>
				<FilterTimeline width={22} fill={colors.white} />
			</div>
			<Text weight="medium">{m['common.follow.action.following']()}</Text>
		</div>
	);
}
