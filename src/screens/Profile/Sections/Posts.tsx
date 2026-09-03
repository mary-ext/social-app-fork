import type { Did } from '@atcute/lexicons/syntax';

import { useOpenComposer } from '#/features/composer/open-composer';

import { FilterMenu } from '#/screens/Profile/components/FilterMenu';
import { ProfileFeedSection } from '#/screens/Profile/Sections/Feed';

import * as Menu from '#/components/Menu';
import { Button, ButtonText } from '#/components/web/Button';

import EditIcon from '#/icons/central/EditBig_round_outlined_radius3_stroke1.svg';
import { m } from '#/paraglide/messages';
import { useParams } from '#/router';

const usePostsFilter = () => {
	const [{ replies, reposts }] = useParams('Profile');
	return { showReplies: replies ?? false, showReposts: reposts ?? true };
};

/** @returns the profile post filter menu */
export function ProfilePostsFilter() {
	const [, replaceParams] = useParams('Profile');

	const { showReplies, showReposts } = usePostsFilter();

	return (
		<FilterMenu label={m['screens.profile.filter.a11y.label']()}>
			<Menu.CheckboxItem
				label={m['screens.profile.filter.posts.showReplies']()}
				checked={showReplies}
				onCheckedChange={(next) => replaceParams({ replies: next ? true : undefined })}
			>
				<Menu.ItemText>{m['screens.profile.filter.posts.showReplies']()}</Menu.ItemText>
				<Menu.ItemCheckbox />
			</Menu.CheckboxItem>
			<Menu.CheckboxItem
				label={m['screens.profile.filter.posts.showReposts']()}
				checked={showReposts}
				onCheckedChange={(next) => replaceParams({ reposts: next ? undefined : false })}
			>
				<Menu.ItemText>{m['screens.profile.filter.posts.showReposts']()}</Menu.ItemText>
				<Menu.ItemCheckbox />
			</Menu.CheckboxItem>
		</FilterMenu>
	);
}

/**
 * renders a profile's posts feed.
 *
 * @param props the section props
 * @returns the posts section
 */
export function ProfilePostsSection({ did, isMe }: { did: Did; isMe: boolean }) {
	const { openComposer } = useOpenComposer();

	const { showReplies, showReposts } = usePostsFilter();
	const composeLabel = m['common.compose.action.writePost']();

	return (
		<ProfileFeedSection
			feed={{ type: 'author', did, view: 'posts', showReplies, showReposts }}
			ignoreFilterFor={did}
			emptyStateMessage={m['common.post.empty']()}
			emptyStateActions={
				isMe && (
					<Button
						color="primary"
						label={composeLabel}
						onClick={() => openComposer({})}
						size="small"
						variant="solid"
					>
						<ButtonText>{composeLabel}</ButtonText>
					</Button>
				)
			}
			emptyStateIcon={EditIcon}
		/>
	);
}
