import type { Ref } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';

import type { Shadow } from '#/state/cache/types';

import { formatCount } from '#/locale/intl/number';

import { ProfileMenu } from '#/screens/Profile/components/ProfileMenu';

import { Text } from '#/components/Text';
import { Button, ButtonIcon } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';

import Ellipsis from '#/icons/central/DotGrid1x3Horizontal_round_outlined_radius1_stroke2.svg';
import SearchIcon from '#/icons/central/MagnifyingGlass_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useRouter } from '#/router';

import * as css from './Sticky.css';

interface Props {
	isPlaceholderProfile: boolean;
	profile: Shadow<AppBskyActorDefs.ProfileViewDetailed>;
	ref?: Ref<HTMLDivElement>;
}

/**
 * renders a profile header that solidifies as the banner scrolls away.
 *
 * @param isPlaceholderProfile whether to hide profile details
 * @param profile displayed profile
 * @param ref header ref
 */
export function ProfileStickyHeader({ isPlaceholderProfile, profile, ref }: Props) {
	const router = useRouter();
	const postsCount = profile.postsCount || 0;

	return (
		<div className={css.outer} ref={ref}>
			<Layout.Header.BackButton className={css.action} variant="scrim" />
			{/* keeps trailing controls aligned while loading */}
			<Layout.Header.Content className={Layout.ScrollAway.reveal}>
				{!isPlaceholderProfile && (
					<>
						<Text numberOfLines={1} size="lg" weight="bold">
							{profile.handle}
						</Text>
						<Text color="textContrastMedium" numberOfLines={1} size="sm">
							{m['screens.profile.posts.count']({
								count: postsCount,
								formatted: formatCount(postsCount),
							})}
						</Text>
					</>
				)}
			</Layout.Header.Content>
			<Layout.Header.EndSlot>
				<Button
					className={css.action}
					label={m['view.profile.action.searchPosts']()}
					variant="scrim"
					shape="round"
					onClick={() => router.navigate({ to: { name: 'ProfileSearch', actor: profile.did } })}
				>
					<ButtonIcon icon={SearchIcon} size="lg" />
				</Button>
				<ProfileMenu
					profile={profile}
					render={
						<Button
							className={css.action}
							label={m['common.a11y.moreOptions']()}
							variant="scrim"
							shape="round"
						>
							<ButtonIcon icon={Ellipsis} size="lg" />
						</Button>
					}
				/>
			</Layout.Header.EndSlot>
			<Layout.ScrollAway.Backdrop />
		</div>
	);
}
