import { useLingui } from '@lingui/react/macro';

import { makeProfileLink } from '#/lib/routes/links';

import { formatCount } from '#/view/com/util/numeric/format';

import { Text } from '#/components/Text';
import { InlineLinkText } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

import { useProfileHeader } from './Context';
import * as css from './Metrics.css';

/** Follower / following / post counts, the first two linking to their respective lists. */
export function ProfileHeaderMetrics() {
	const { i18n } = useLingui();
	const {
		state: { profile },
	} = useProfileHeader();

	const followers = formatCount(i18n, profile.followersCount || 0);
	const following = formatCount(i18n, profile.followsCount || 0);
	const pluralizedFollowers = m['common.count.followers']({ count: profile.followersCount || 0 });
	const pluralizedFollowings = m['common.count.following']({ count: profile.followsCount || 0 });

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
				label={m['screens.profile.label.followingCount']({ count: profile.followsCount || 0 })}
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
				{formatCount(i18n, profile.postsCount || 0)}{' '}
				<Text color="textContrastMedium" size="md" weight="normal">
					{m['screens.profile.count.posts']({ count: profile.postsCount || 0 })}
				</Text>
			</Text>
		</div>
	);
}
