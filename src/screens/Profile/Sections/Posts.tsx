import type { Did } from '@atcute/lexicons/syntax';

import { definite } from '@mary/array-fns';

import { formatConjunction } from '#/locale/intl/list';

import { useOpenComposer } from '#/features/composer/open-composer';

import { FeedFilterBar } from '#/screens/Profile/components/FeedFilterBar';
import { ProfileFeedSection } from '#/screens/Profile/Sections/Feed';

import * as Menu from '#/components/Menu';

import { m } from '#/paraglide/messages';
import { useParams } from '#/router';

const summarize = ({ showReplies, showReposts }: { showReplies: boolean; showReposts: boolean }) => {
	if (!showReplies && !showReposts) {
		return m['screens.profile.filter.posts.postsOnly']();
	}
	return formatConjunction(
		definite([
			m['common.post.label'](),
			showReplies && m['screens.profile.filter.posts.replies'](),
			showReposts && m['screens.profile.filter.posts.reposts'](),
		]),
	);
};

/**
 * renders a profile's posts feed.
 *
 * @param props the section props
 * @returns the posts section
 */
export function ProfilePostsSection({ did, isMe }: { did: Did; isMe: boolean }) {
	const [{ replies, reposts }, replaceParams] = useParams('Profile');
	const { openComposer } = useOpenComposer();

	const showReplies = replies ?? false;
	const showReposts = reposts ?? true;
	const composeLabel = m['common.compose.action.writePost']();

	return (
		<>
			<FeedFilterBar
				summary={summarize({ showReplies, showReposts })}
				label={m['screens.profile.filter.a11y.label']()}
			>
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
			</FeedFilterBar>
			<ProfileFeedSection
				feed={{ type: 'author', did, view: 'posts', showReplies, showReposts }}
				ignoreFilterFor={did}
				emptyStateMessage={m['common.post.empty']()}
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
			/>
		</>
	);
}
