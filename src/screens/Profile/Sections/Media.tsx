import type { Did } from '@atcute/lexicons/syntax';

import { useOpenComposer } from '#/features/composer/open-composer';

import { FilterMenu } from '#/screens/Profile/components/FilterMenu';
import { ProfileFeedSection } from '#/screens/Profile/Sections/Feed';

import * as Menu from '#/components/Menu';

import ImageIcon from '#/icons/central/Images1_round_outlined_radius1_stroke1.svg';
import VideoIcon from '#/icons/central/VideoClip_round_outlined_radius3_stroke1.svg';
import { m } from '#/paraglide/messages';
import { useParams } from '#/router';

const useMediaView = () => {
	const [{ media }] = useParams('Profile');
	return media ?? 'all';
};

/** @returns the profile media filter menu */
export function ProfileMediaFilter() {
	const [, replaceParams] = useParams('Profile');

	const isVideos = useMediaView() === 'videos';

	return (
		<FilterMenu label={m['screens.profile.filter.a11y.label']()}>
			<Menu.Item
				label={m['screens.profile.filter.media.all']()}
				onClick={() => replaceParams({ media: undefined })}
			>
				<Menu.ItemText>{m['screens.profile.filter.media.all']()}</Menu.ItemText>
				<Menu.ItemRadio selected={!isVideos} />
			</Menu.Item>
			<Menu.Item
				label={m['screens.profile.filter.media.videos']()}
				onClick={() => replaceParams({ media: 'videos' })}
			>
				<Menu.ItemText>{m['screens.profile.filter.media.videos']()}</Menu.ItemText>
				<Menu.ItemRadio selected={isVideos} />
			</Menu.Item>
		</FilterMenu>
	);
}

/**
 * renders a profile's media feed.
 *
 * @param props the section props
 * @returns the media section
 */
export function ProfileMediaSection({ did, isMe }: { did: Did; isMe: boolean }) {
	const { openComposer } = useOpenComposer();

	const view = useMediaView();
	const isVideos = view === 'videos';
	const composeLabel = isVideos ? m['common.compose.action.video']() : m['common.compose.action.photo']();

	return (
		<ProfileFeedSection
			feed={{ type: 'author', did, view: 'media', media: view }}
			ignoreFilterFor={did}
			emptyStateMessage={isVideos ? m['common.video.empty']() : m['common.media.empty']()}
			emptyStateButton={
				isMe
					? {
							color: 'primary',
							label: composeLabel,
							onPress: () => openComposer({}),
							text: composeLabel,
						}
					: undefined
			}
			emptyStateIcon={isVideos ? VideoIcon : ImageIcon}
		/>
	);
}
