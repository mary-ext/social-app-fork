import { makeProfileLink } from '#/lib/routes/links';

import { formatCount } from '#/locale/intl/number';

import { Text } from '#/components/Text';
import { InlineLinkText } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

import { useProfileHeader } from './Context';
import * as css from './Metrics.css';

/** Follower / following / post counts, the first two linking to their respective lists. */
export function ProfileHeaderMetrics() {
	const {
		state: { profile },
	} = useProfileHeader();

	const followers = formatCount(profile.followersCount || 0);
	const following = formatCount(profile.followsCount || 0);
	const pluralizedFollowers = m['common.follow.followersUnit']({ count: profile.followersCount || 0 });
	const pluralizedFollowings = m['common.follow.followingUnit']({ count: profile.followsCount || 0 });

	return (
		<div className={css.row}>
			<InlineLinkText
				color="text"
				label={`${profile.followersCount || 0} ${pluralizedFollowers}`}
				to={makeProfileLink(profile, 'followers')}
			>
				<Text size="md" weight="semiBold">
					{followers}{' '}
				</Text>
				<Text color="textContrastMedium" size="md">
					{pluralizedFollowers}
				</Text>
			</InlineLinkText>
			<InlineLinkText
				color="text"
				label={m['screens.profile.follow.following.countLabel']({ count: profile.followsCount || 0 })}
				to={makeProfileLink(profile, 'follows')}
			>
				<Text size="md" weight="semiBold">
					{following}{' '}
				</Text>
				<Text color="textContrastMedium" size="md">
					{pluralizedFollowings}
				</Text>
			</InlineLinkText>
			<Text color="text" size="md" weight="semiBold">
				{formatCount(profile.postsCount || 0)}{' '}
				<Text color="textContrastMedium" size="md" weight="normal">
					{m['screens.profile.posts.count']({ count: profile.postsCount || 0 })}
				</Text>
			</Text>
		</div>
	);
}
