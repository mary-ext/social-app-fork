import type { Ref } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';

import { formatCount } from '#/locale/intl/number';

import { Text } from '#/components/Text';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';

import * as css from './Sticky.css';

interface Props {
	isPlaceholderProfile: boolean;
	profile: AppBskyActorDefs.ProfileViewDetailed;
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
	const postsCount = profile.postsCount || 0;

	return (
		<div className={css.outer} ref={ref}>
			<Layout.Header.BackButton className={css.backButton} variant="scrim" />
			{!isPlaceholderProfile && (
				<div className={css.content}>
					<Text numberOfLines={1} size="lg" weight="bold">
						{profile.handle}
					</Text>
					<Text color="textContrastMedium" numberOfLines={1} size="sm">
						{m['screens.profile.posts.count']({
							count: postsCount,
							formatted: formatCount(postsCount),
						})}
					</Text>
				</div>
			)}
			<div className={css.backdrop} />
		</div>
	);
}
