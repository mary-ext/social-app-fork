import { memo, type ReactElement, type ReactNode, useState } from 'react';

import type { AnyProfileView, AnyStarterPackView, AppBskyFeedDefs } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderatePost,
	moderateProfile,
	type ModerationDecision,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';
import { ok } from '@atcute/client';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { uniqueBy } from '@mary-ext/array-fns';

import { useQueryClient } from '@tanstack/react-query';

import { getPostRecord, getStarterPackRecord } from '#/lib/api/record-casts';
import { MAX_POST_LINES } from '#/lib/constants/post';
import { isAbortError } from '#/lib/errors';
import {
	type ActorGroupNotification,
	isActorGroupNotification,
	type NotificationView,
} from '#/lib/notifications/types';
import { feedTarget, postUriToTarget, profileTarget, starterPackTarget } from '#/lib/routes/targets';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useGroupActorsQuery } from '#/state/queries/notifications/feed';
import { getUnresolvedActorDids } from '#/state/queries/notifications/lib/group-actors';
import { useProfileFollowMutationQueue } from '#/state/queries/profile/follow';
import { unstableCacheProfileView } from '#/state/queries/profile/unstable-cache';
import { getClients, useSession } from '#/state/session';

import { niceDate } from '#/locale/intl/datetime';
import { Trans } from '#/locale/Trans';

import {
	Notification as StarterPackCard,
	useStarterPackLink,
} from '#/features/starter-packs/StarterPackCard';

import { BlockLink } from '#/components/BlockLink';
import * as FeedCard from '#/components/FeedCard';
import * as MediaPreview from '#/components/MediaPreview';
import { Post } from '#/components/Post/Post';
import { useNavigablePost } from '#/components/Post/use-navigable-post';
import { PreviewableUserAvatar } from '#/components/PreviewableUserAvatar';
import * as Collapsible from '#/components/primitives/collapsible';
import { ProfileBadges } from '#/components/ProfileBadges';
import { ProfileHoverCard } from '#/components/ProfileHoverCard';
import { Text } from '#/components/Text';
import { TimeElapsed } from '#/components/TimeElapsed';
import * as Toast from '#/components/Toast';
import { Tooltip } from '#/components/Tooltip';
import { Button, ButtonIcon, ButtonSpinner, ButtonText } from '#/components/web/Button';
import { InlineLinkText } from '#/components/web/Link';
import * as ProfileCard from '#/components/web/ProfileCard';

import BellRingingIcon from '#/icons/central-custom/BellRinging_round_filled_radius1_stroke2.svg';
import RepostIcon from '#/icons/central/ArrowsRepeatRightLeft_round_outlined_radius1_stroke2.svg';
import CheckIcon from '#/icons/central/Checkmark2_round_outlined_radius1_stroke2.svg';
import ChevronDownIcon from '#/icons/central/ChevronBottom_round_outlined_radius1_stroke2.svg';
import ChevronUpIcon from '#/icons/central/ChevronTop_round_outlined_radius1_stroke2.svg';
import ContactsIconFilled from '#/icons/central/Contacts_round_filled_radius1_stroke2.svg';
import HeartIconFilled from '#/icons/central/Heart2_round_filled_radius1_stroke2.svg';
import PersonPlusIcon from '#/icons/central/PeopleAdd_round_filled_radius1_stroke2.svg';
import PlusIcon from '#/icons/central/PlusLarge_round_outlined_radius1_stroke2.svg';
import StarterPack from '#/icons/original/StarterPack.svg';
import StarterPackSky from '#/icons/original/StarterPackSky.svg';
import VerifiedCheck from '#/icons/original/VerifiedCheck.svg';
import { m } from '#/paraglide/messages';
import { type RouteTarget, useRouter } from '#/router';
import { colors } from '#/styles/colors';

import * as css from './NotificationFeedItem.css';

const MAX_AUTHORS = 5;

/** every kind except the post-shaped ones, which render as a regular post. */
type ActivityNotification = Exclude<NotificationView, { type: 'reply' | 'quote' | 'mention' }>;

interface Author {
	profile: AnyProfileView;
	moderation: ModerationDecision;
}

let NotificationFeedItem = ({
	item,
	moderationOpts,
	highlightUnread,
	hideTopBorder,
}: {
	item: NotificationView;
	moderationOpts: ModerationOptions;
	highlightUnread: boolean;
	hideTopBorder?: boolean;
}): ReactNode => {
	switch (item.type) {
		case 'reply':
		case 'quote':
		case 'mention': {
			const isHighlighted = highlightUnread && !item.isRead;
			return (
				<Post
					post={item.post}
					style={
						isHighlighted ? { backgroundColor: colors.bgUnread, borderColor: colors.primary_100 } : undefined
					}
					hideTopBorder={hideTopBorder}
				/>
			);
		}
	}

	return <ActivityRow item={item} moderationOpts={moderationOpts} hideTopBorder={hideTopBorder} />;
};
NotificationFeedItem = memo(NotificationFeedItem);
export { NotificationFeedItem };

// #region activity row

function ActivityRow({
	item,
	moderationOpts,
	hideTopBorder,
}: {
	item: ActivityNotification;
	moderationOpts: ModerationOptions;
	hideTopBorder: boolean | undefined;
}) {
	const queryClient = useQueryClient();
	const { itemProps } = useNavigablePost();

	const authors: Author[] = getAuthorProfiles(item).map((profile) => ({
		profile,
		moderation: moderateProfile(profile, moderationOpts),
	}));
	const firstAuthor = authors[0]!;
	// subscribed posts count posts rather than people, so there the resolved authors are everyone
	const othersCount = isActorGroupNotification(item) ? item.count - 1 : authors.length - 1;

	const authorLink = ({ children }: { children?: ReactNode }) => (
		<ProfileHoverCard actor={firstAuthor.profile.did}>
			<InlineLinkText
				to={profileTarget(firstAuthor.profile.did)}
				label={m['view.notifications.a11y.goToProfile']({ name: firstAuthor.profile.handle })}
				color="text"
				weight="semiBold"
				size="md"
			>
				{children}
				<span className={css.badgeWrap}>
					<ProfileBadges profile={firstAuthor.profile} size="md" />
				</span>
			</InlineLinkText>
		</ProfileHoverCard>
	);

	const summary = getSummary(item, { name: firstAuthor.profile.handle, othersCount, authorLink });
	const starterPack = getViaStarterPack(item);
	const starterPackName = starterPack ? getStarterPackRecord(starterPack).name : undefined;
	const niceTimestamp = niceDate(item.indexedAt);

	let a11yLabel = summary.label;
	if (starterPackName !== undefined) {
		a11yLabel += ` ${m['view.notifications.follow.viaStarterPack.a11y']({ name: starterPackName })}`;
	}
	a11yLabel += ` · ${niceTimestamp}`;

	const card = (
		<div className={css.outer({ topBorder: !hideTopBorder, unread: !item.isRead })} {...itemProps}>
			<div className={css.iconColumn}>{getIcon(item)}</div>

			<div className={css.content}>
				<AuthorsList
					authors={authors}
					totalCount={othersCount + 1}
					loadableGroup={
						isActorGroupNotification(item) && getUnresolvedActorDids(item).length > 0 ? item : undefined
					}
					moderationOpts={moderationOpts}
					showDmButton={item.type === 'starterPackJoined'}
				/>

				<Text className={css.notifText}>
					{summary.content}
					<TimeElapsed timestamp={item.indexedAt}>
						{({ timeElapsed }) => (
							<>
								<Text color="textContrastMedium"> &middot; </Text>
								<Tooltip label={niceTimestamp}>
									<Text color="textContrastMedium">{timeElapsed}</Text>
								</Tooltip>
							</>
						)}
					</TimeElapsed>
				</Text>

				{starterPack !== undefined && starterPackName !== undefined ? (
					<FollowedViaStarterPack name={starterPackName} starterPack={starterPack} />
				) : null}

				{(item.type === 'follow' && othersCount === 0) ||
				(item.type === 'contactMatch' && !item.actor.viewer?.following) ? (
					<FollowBackButton profile={firstAuthor.profile} />
				) : null}

				<Preview item={item} moderationOpts={moderationOpts} />
			</div>
		</div>
	);

	const target = getTarget(item);
	if (!target) {
		return card;
	}

	return (
		<BlockLink
			to={target}
			label={a11yLabel}
			onBeforePress={() => unstableCacheProfileView(queryClient, firstAuthor.profile)}
		>
			{card}
		</BlockLink>
	);
}

/** the people shown in the avatar row, primary actor first. */
const getAuthorProfiles = (item: ActivityNotification): AnyProfileView[] => {
	if (isActorGroupNotification(item)) {
		return item.actors;
	}
	if (item.type === 'subscribedPost') {
		return uniqueBy(
			item.items.map(({ actor }) => actor),
			(actor) => actor.did,
		);
	}
	return [item.actor];
};

const getViaStarterPack = (item: ActivityNotification): AnyStarterPackView | undefined => {
	switch (item.type) {
		case 'follow':
		case 'followBack': {
			return item.starterPack;
		}
	}
};

const activityListTarget = (posts: AppBskyFeedDefs.PostView[]): RouteTarget => {
	return {
		name: 'NotificationsActivityList',
		posts: posts.map((post) => post.uri),
	};
};

const getTarget = (item: ActivityNotification): RouteTarget | undefined => {
	switch (item.type) {
		case 'like':
		case 'repost':
		case 'likeViaRepost':
		case 'repostViaRepost': {
			return postUriToTarget(item.post.uri);
		}
		case 'multiPostLike':
		case 'multiPostRepost':
		case 'multiPostLikeViaRepost':
		case 'multiPostRepostViaRepost': {
			return activityListTarget(item.posts);
		}
		case 'subscribedPost': {
			return activityListTarget(item.items.map(({ post }) => post));
		}
		case 'follow': {
			return profileTarget(item.actors[0].did);
		}
		case 'followBack':
		case 'contactMatch':
		case 'verified':
		case 'unverified': {
			return profileTarget(item.actor.did);
		}
		case 'generatorLike': {
			const urip = parseCanonicalResourceUri(item.generator.uri);
			return feedTarget(urip.repo, urip.rkey);
		}
		case 'starterPackJoined': {
			const urip = parseCanonicalResourceUri(item.starterPack.uri);
			return starterPackTarget(urip.repo, urip.rkey);
		}
	}
};

const getIcon = (item: ActivityNotification): ReactElement => {
	switch (item.type) {
		case 'like':
		case 'likeViaRepost':
		case 'multiPostLike':
		case 'multiPostLikeViaRepost':
		case 'generatorLike': {
			return <HeartIconFilled className={css.likeIcon} />;
		}
		case 'repost':
		case 'multiPostRepost': {
			return <RepostIcon className={css.repostIcon} />;
		}
		case 'repostViaRepost':
		case 'multiPostRepostViaRepost': {
			return <RepostIcon className={css.repostViaRepostIcon} />;
		}
		case 'follow':
		case 'followBack': {
			return <PersonPlusIcon className={css.avatarBadgeIcon} />;
		}
		case 'contactMatch': {
			return <ContactsIconFilled className={css.avatarBadgeIcon} />;
		}
		case 'starterPackJoined': {
			return <StarterPackSky className={css.starterPackIcon} />;
		}
		case 'verified': {
			return <VerifiedCheck className={css.verifiedIcon} />;
		}
		case 'unverified': {
			return <VerifiedCheck className={css.unverifiedIcon} />;
		}
		case 'subscribedPost': {
			return <BellRingingIcon className={css.bellRingingIcon} />;
		}
	}
};

const othersCountMarkup = ({ children }: { children?: ReactNode }) => (
	<Text weight="semiBold">{children}</Text>
);

/** the row's sentence, as plain text for screen readers and as rich content. */
const getSummary = (
	item: ActivityNotification,
	{
		name,
		othersCount,
		authorLink,
	}: {
		name: string;
		othersCount: number;
		authorLink: (args: { children?: ReactNode }) => ReactNode;
	},
): { label: string; content: ReactElement } => {
	const multi = { count: othersCount, name };
	const multiMarkup = { authorLink, t0: othersCountMarkup };
	const single = { name };
	const singleMarkup = { authorLink };
	// how many posts, for kinds from one person about several posts
	const counted = { count: item.count, name };
	const isMulti = othersCount > 0;

	switch (item.type) {
		case 'like': {
			return isMulti
				? {
						label: m['view.notifications.like.post.multiName'](multi),
						content: (
							<Trans
								message={m['view.notifications.like.post.multiLink']}
								inputs={multi}
								markup={multiMarkup}
							/>
						),
					}
				: {
						label: m['view.notifications.like.post.singleName'](single),
						content: (
							<Trans
								message={m['view.notifications.like.post.singleLink']}
								inputs={single}
								markup={singleMarkup}
							/>
						),
					};
		}
		case 'repost': {
			return isMulti
				? {
						label: m['view.notifications.repost.post.multiName'](multi),
						content: (
							<Trans
								message={m['view.notifications.repost.post.multiLink']}
								inputs={multi}
								markup={multiMarkup}
							/>
						),
					}
				: {
						label: m['view.notifications.repost.post.singleName'](single),
						content: (
							<Trans
								message={m['view.notifications.repost.post.singleLink']}
								inputs={single}
								markup={singleMarkup}
							/>
						),
					};
		}
		case 'likeViaRepost': {
			return isMulti
				? {
						label: m['view.notifications.like.repost.multiName'](multi),
						content: (
							<Trans
								message={m['view.notifications.like.repost.multiLink']}
								inputs={multi}
								markup={multiMarkup}
							/>
						),
					}
				: {
						label: m['view.notifications.like.repost.singleName'](single),
						content: (
							<Trans
								message={m['view.notifications.like.repost.singleLink']}
								inputs={single}
								markup={singleMarkup}
							/>
						),
					};
		}
		case 'repostViaRepost': {
			return isMulti
				? {
						label: m['view.notifications.repost.repost.multiName'](multi),
						content: (
							<Trans
								message={m['view.notifications.repost.repost.multiLink']}
								inputs={multi}
								markup={multiMarkup}
							/>
						),
					}
				: {
						label: m['view.notifications.repost.repost.singleName'](single),
						content: (
							<Trans
								message={m['view.notifications.repost.repost.singleLink']}
								inputs={single}
								markup={singleMarkup}
							/>
						),
					};
		}
		case 'multiPostLike': {
			return {
				label: m['view.notifications.like.posts.singleName'](counted),
				content: (
					<Trans
						message={m['view.notifications.like.posts.singleLink']}
						inputs={counted}
						markup={singleMarkup}
					/>
				),
			};
		}
		case 'multiPostRepost': {
			return {
				label: m['view.notifications.repost.posts.singleName'](counted),
				content: (
					<Trans
						message={m['view.notifications.repost.posts.singleLink']}
						inputs={counted}
						markup={singleMarkup}
					/>
				),
			};
		}
		case 'multiPostLikeViaRepost': {
			return {
				label: m['view.notifications.like.reposts.singleName'](counted),
				content: (
					<Trans
						message={m['view.notifications.like.reposts.singleLink']}
						inputs={counted}
						markup={singleMarkup}
					/>
				),
			};
		}
		case 'multiPostRepostViaRepost': {
			return {
				label: m['view.notifications.repost.reposts.singleName'](counted),
				content: (
					<Trans
						message={m['view.notifications.repost.reposts.singleLink']}
						inputs={counted}
						markup={singleMarkup}
					/>
				),
			};
		}
		case 'follow': {
			return isMulti
				? {
						label: m['view.notifications.follow.multiName'](multi),
						content: (
							<Trans message={m['view.notifications.follow.multiLink']} inputs={multi} markup={multiMarkup} />
						),
					}
				: {
						label: m['view.notifications.follow.singleName'](single),
						content: (
							<Trans
								message={m['view.notifications.follow.singleLink']}
								inputs={single}
								markup={singleMarkup}
							/>
						),
					};
		}
		case 'followBack': {
			return {
				label: m['view.notifications.follow.back.singleName'](single),
				content: (
					<Trans
						message={m['view.notifications.follow.back.singleLink']}
						inputs={single}
						markup={singleMarkup}
					/>
				),
			};
		}
		case 'generatorLike': {
			return isMulti
				? {
						label: m['view.notifications.like.feed.multiName'](multi),
						content: (
							<Trans
								message={m['view.notifications.like.feed.multiLink']}
								inputs={multi}
								markup={multiMarkup}
							/>
						),
					}
				: {
						label: m['view.notifications.like.feed.singleName'](single),
						content: (
							<Trans
								message={m['view.notifications.like.feed.singleLink']}
								inputs={single}
								markup={singleMarkup}
							/>
						),
					};
		}
		case 'subscribedPost': {
			if (isMulti) {
				return {
					label: m['view.notifications.newPosts.multiName'](multi),
					content: (
						<Trans message={m['view.notifications.newPosts.multiLink']} inputs={multi} markup={multiMarkup} />
					),
				};
			}
			return {
				label: m['view.notifications.newPosts.singleName'](counted),
				content: (
					<Trans
						message={m['view.notifications.newPosts.singleLink']}
						inputs={counted}
						markup={singleMarkup}
					/>
				),
			};
		}
		case 'contactMatch': {
			return {
				label: m['view.notifications.contact.singleName'](single),
				content: (
					<Trans message={m['view.notifications.contact.singleLink']} inputs={single} markup={singleMarkup} />
				),
			};
		}
		case 'starterPackJoined': {
			return {
				label: m['view.notifications.starterPack.singleName'](single),
				content: (
					<Trans
						message={m['view.notifications.starterPack.singleLink']}
						inputs={single}
						markup={singleMarkup}
					/>
				),
			};
		}
		case 'verified': {
			return {
				label: m['view.notifications.verification.verified.singleName'](single),
				content: (
					<Trans
						message={m['view.notifications.verification.verified.singleLink']}
						inputs={single}
						markup={singleMarkup}
					/>
				),
			};
		}
		case 'unverified': {
			return {
				label: m['view.notifications.verification.removed.singleName'](single),
				content: (
					<Trans
						message={m['view.notifications.verification.removed.singleLink']}
						inputs={single}
						markup={singleMarkup}
					/>
				),
			};
		}
	}
};

/** what the notification is about: a post excerpt, a feed, or a starter pack. */
function Preview({
	item,
	moderationOpts,
}: {
	item: ActivityNotification;
	moderationOpts: ModerationOptions;
}) {
	switch (item.type) {
		case 'like':
		case 'repost':
		case 'likeViaRepost':
		case 'repostViaRepost': {
			return <AdditionalPost post={item.post} moderationOpts={moderationOpts} />;
		}
		case 'multiPostLike':
		case 'multiPostRepost':
		case 'multiPostLikeViaRepost':
		case 'multiPostRepostViaRepost': {
			return <AdditionalPost post={item.posts[0]} moderationOpts={moderationOpts} />;
		}
		case 'subscribedPost': {
			return <AdditionalPost post={item.items[0].post} moderationOpts={moderationOpts} />;
		}
		case 'generatorLike': {
			return (
				<div className={css.feedCardWrap}>
					<FeedCard.Embed view={item.generator} />
				</div>
			);
		}
		case 'starterPackJoined': {
			return (
				<div className={css.starterPackBox}>
					<StarterPackCard starterPack={item.starterPack} />
				</div>
			);
		}
	}
	return null;
}

// #endregion

// #region authors

function AuthorsList({
	authors,
	totalCount,
	loadableGroup,
	moderationOpts,
	showDmButton,
}: {
	authors: Author[];
	/** how many people the notification is from, including those without a resolved profile. */
	totalCount: number;
	/** set when the group has actors left to load on demand. */
	loadableGroup: ActorGroupNotification | undefined;
	moderationOpts: ModerationOptions;
	showDmButton: boolean;
}) {
	const [isExpanded, setIsExpanded] = useState(false);

	// a single author needs no toggle: just the avatar (and the say-hello affordance for starter packs)
	if (totalCount < 2) {
		const author = authors[0]!;
		return (
			<div className={css.avatarsRow}>
				<PreviewableUserAvatar
					size={css.NOTIF_AVI_SIZE}
					profile={author.profile}
					moderation={getDisplayRestrictions(author.moderation, DisplayContext.ProfileMedia)}
					type={author.profile.associated?.labeler ? 'labeler' : 'user'}
				/>
				{showDmButton ? <SayHelloBtn profile={author.profile} /> : null}
			</div>
		);
	}

	const shownAuthors = authors.slice(0, MAX_AUTHORS);

	return (
		<Collapsible.Root className={css.authorsCollapsible} open={isExpanded} onOpenChange={setIsExpanded}>
			<Collapsible.Trigger
				className={css.authorsTrigger}
				aria-label={
					isExpanded
						? m['view.notifications.a11y.collapseUsers']()
						: m['view.notifications.a11y.expandUsers']()
				}
			>
				{isExpanded ? (
					<>
						<div className={css.authorChevron}>
							<ChevronUpIcon className={css.chevronUpIcon} />
						</div>
						<Text color="textContrastHigh" weight="semiBold">
							{m['common.action.hide']()}
						</Text>
					</>
				) : (
					<>
						{shownAuthors.map((author) => (
							<PreviewableUserAvatar
								key={author.profile.did}
								size={css.NOTIF_AVI_SIZE}
								profile={author.profile}
								moderation={getDisplayRestrictions(author.moderation, DisplayContext.ProfileMedia)}
								type={author.profile.associated?.labeler ? 'labeler' : 'user'}
							/>
						))}

						{totalCount > shownAuthors.length ? (
							<Text weight="semiBold" color="textContrastMedium" className={css.moreCount}>
								+{totalCount - shownAuthors.length}
							</Text>
						) : null}

						<div className={css.authorChevron}>
							<ChevronDownIcon className={css.chevronDownIcon} />
						</div>
					</>
				)}
			</Collapsible.Trigger>
			<Collapsible.Panel className={css.expandContent}>
				{authors.map((author, i) => (
					<ExpandedAuthorProfileCard
						key={author.profile.did}
						profile={author.profile}
						moderationOpts={moderationOpts}
						isLast={!loadableGroup && i === authors.length - 1}
					/>
				))}
				{loadableGroup ? <LoadedAuthors group={loadableGroup} moderationOpts={moderationOpts} /> : null}
			</Collapsible.Panel>
		</Collapsible.Root>
	);
}

/** the actors the notification didn't include a profile for, loaded on demand. */
function LoadedAuthors({
	group,
	moderationOpts,
}: {
	group: ActorGroupNotification;
	moderationOpts: ModerationOptions;
}) {
	const { actors, hasMore, isFetching, fetchNextPage } = useGroupActorsQuery(group);

	return (
		<>
			{actors.map((profile, i) => (
				<ExpandedAuthorProfileCard
					key={profile.did}
					profile={profile}
					moderationOpts={moderationOpts}
					isLast={!hasMore && i === actors.length - 1}
				/>
			))}
			{hasMore ? (
				<Button
					label={m['view.notifications.authors.showMore']()}
					variant="ghost"
					color="secondary"
					size="small"
					disabled={isFetching}
					onClick={() => void fetchNextPage()}
				>
					<ButtonText>{m['view.notifications.authors.showMore']()}</ButtonText>
					{isFetching ? <ButtonSpinner color="default" label={m['common.status.loading']()} /> : null}
				</Button>
			) : null}
		</>
	);
}

function ExpandedAuthorProfileCard({
	profile,
	moderationOpts,
	isLast,
}: {
	profile: AnyProfileView;
	moderationOpts: ModerationOptions;
	isLast: boolean;
}) {
	return (
		<ProfileCard.Link profile={profile} className={isLast ? undefined : css.expandCardGap}>
			<ProfileCard.Outer>
				<ProfileCard.Header>
					<ProfileCard.Avatar profile={profile} moderationOpts={moderationOpts} />
					<ProfileCard.NameAndHandle profile={profile} moderationOpts={moderationOpts} />
					<div className={css.followControl}>
						<ProfileCard.FollowButton profile={profile} variant="subtle" />
					</div>
				</ProfileCard.Header>
			</ProfileCard.Outer>
		</ProfileCard.Link>
	);
}

// #endregion

// #region extras

function FollowedViaStarterPack({ name, starterPack }: { name: string; starterPack: AnyStarterPackView }) {
	const link = useStarterPackLink({ view: starterPack });

	return (
		<Text className={css.viaStarterPack} size="sm" color="textContrastMedium">
			<Trans
				message={m['view.notifications.follow.viaStarterPack.link']}
				inputs={{ name }}
				markup={{
					packLink: ({ children }) => (
						<InlineLinkText
							to={link.to}
							label={link.label}
							onPress={link.precache}
							onPointerEnter={link.precache}
							color="text"
							weight="semiBold"
							size="sm"
						>
							<StarterPack className={css.viaStarterPackIcon} />
							{children}
						</InlineLinkText>
					),
				}}
			/>
		</Text>
	);
}

function FollowBackButton({ profile }: { profile: AnyProfileView }) {
	const { currentAccount, hasSession } = useSession();
	const profileShadow = useProfileShadow(profile);
	const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(profileShadow);

	// Don't show button if not logged in or for own profile
	if (!hasSession || profile.did === currentAccount?.did) {
		return null;
	}

	const onPressFollow = async () => {
		try {
			await queueFollow();
			Toast.show(m['common.follow.a11y.following']({ name: profile.handle }));
		} catch (err) {
			if (!isAbortError(err)) {
				Toast.show(m['common.error.generic'](), { type: 'error' });
			}
		}
	};

	const onPressUnfollow = async () => {
		try {
			await queueUnfollow();
			Toast.show(m['common.follow.noLongerFollowing']({ name: profile.handle }));
		} catch (err) {
			if (!isAbortError(err)) {
				Toast.show(m['common.error.generic'](), { type: 'error' });
			}
		}
	};

	// Don't show button if viewer data is missing or user is blocked
	if (!profileShadow.viewer) {
		return null;
	}
	if (
		profileShadow.viewer.blockedBy ||
		profileShadow.viewer.blocking ||
		profileShadow.viewer.blockingByList
	) {
		return null;
	}

	const isFollowing = profileShadow.viewer.following;
	const isFollowedBy = profileShadow.viewer.followedBy;
	const followingLabel = m['common.follow.action.following']();

	return (
		<div className={css.followBtnWrap}>
			<div className={css.followControl}>
				{isFollowing ? (
					<Button
						label={followingLabel}
						color="secondary"
						size="small"
						onClick={() => void onPressUnfollow()}
					>
						<ButtonIcon icon={CheckIcon} />
						<ButtonText>{m['common.follow.action.following']()}</ButtonText>
					</Button>
				) : (
					<Button
						label={isFollowedBy ? m['common.follow.action.followBack']() : m['common.follow.action.follow']()}
						color="primary"
						size="small"
						onClick={() => void onPressFollow()}
					>
						<ButtonIcon icon={PlusIcon} />
						<ButtonText>
							{isFollowedBy ? m['common.follow.action.followBack']() : m['common.follow.action.follow']()}
						</ButtonText>
					</Button>
				)}
			</div>
		</div>
	);
}

function SayHelloBtn({ profile }: { profile: AnyProfileView }) {
	const { chat } = getClients();
	const { currentAccount } = useSession();
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	const onPressSayHello = async () => {
		if (!chat || !currentAccount) {
			return;
		}
		try {
			setIsLoading(true);
			const data = await ok(
				chat.get('chat.bsky.convo.getConvoForMembers', {
					params: { members: [profile.did, currentAccount.did] },
				}),
			);
			router.navigate({ to: { name: 'MessagesConversation', conversation: data.convo.id } });
		} catch (e) {
			console.error('Failed to get conversation', e);
		}
		setIsLoading(false);
	};

	if (
		profile.associated?.chat?.allowIncoming === 'none' ||
		(profile.associated?.chat?.allowIncoming === 'following' && !profile.viewer?.followedBy)
	) {
		return null;
	}

	return (
		<Button
			label={m['common.compose.sayHello']()}
			variant="ghost"
			color="primary"
			size="small"
			className={css.sayHelloBtn}
			disabled={isLoading}
			onClick={() => void onPressSayHello()}
		>
			<ButtonText>{m['common.compose.sayHello']()}</ButtonText>
		</Button>
	);
}

function AdditionalPost({
	post,
	moderationOpts,
}: {
	post: AppBskyFeedDefs.PostView;
	moderationOpts: ModerationOptions;
}) {
	const record = getPostRecord(post);
	const text = record.text;

	return (
		<div className={css.additionalWrap}>
			{text?.length > 0 && (
				<Text size="md_sub" color="textContrastMedium" numberOfLines={MAX_POST_LINES}>
					{text}
				</Text>
			)}

			<MediaPreview.Embed
				embed={post.embed}
				moderation={getDisplayRestrictions(moderatePost(post, moderationOpts), DisplayContext.ContentMedia)}
				className={css.additionalPostEmbed}
			/>
		</div>
	);
}

// #endregion
