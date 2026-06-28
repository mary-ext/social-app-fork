import { makeProfileLink } from '#/lib/routes/links';

import { formatCount } from '#/locale/intl/number';
import { Trans } from '#/locale/Trans';

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

	const followersCount = profile.followersCount || 0;
	const followsCount = profile.followsCount || 0;
	const postsCount = profile.postsCount || 0;

	return (
		<div className={css.row}>
			<InlineLinkText
				color="text"
				label={m['common.follow.followersCount']({
					count: followersCount,
					formatted: formatCount(followersCount),
				})}
				to={makeProfileLink(profile, 'followers')}
			>
				<Text color="textContrastMedium" size="md">
					<Trans
						inputs={{ count: followersCount, formatted: formatCount(followersCount) }}
						markup={{
							t0: ({ children }) => (
								<Text color="text" size="md" weight="semiBold">
									{children}
								</Text>
							),
						}}
						message={m['view.profile.followers.followersCount']}
					/>
				</Text>
			</InlineLinkText>
			<InlineLinkText
				color="text"
				label={m['screens.profile.follow.following.countLabel']({ count: followsCount })}
				to={makeProfileLink(profile, 'follows')}
			>
				<Text color="textContrastMedium" size="md">
					<Trans
						inputs={{ count: followsCount, formatted: formatCount(followsCount) }}
						markup={{
							t0: ({ children }) => (
								<Text color="text" size="md" weight="semiBold">
									{children}
								</Text>
							),
						}}
						message={m['view.profile.followers.followingCount']}
					/>
				</Text>
			</InlineLinkText>
			<Text color="textContrastMedium" size="md">
				<Trans
					inputs={{ count: postsCount, formatted: formatCount(postsCount) }}
					markup={{
						t0: ({ children }) => (
							<Text color="text" size="md" weight="semiBold">
								{children}
							</Text>
						),
					}}
					message={m['screens.profile.posts.count']}
				/>
			</Text>
		</div>
	);
}
