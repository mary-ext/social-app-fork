import { memo, type MouseEvent, useCallback, useMemo, useState } from 'react';
import type {
	AnyProfileView,
	AppBskyActorDefs,
	AppBskyFeedDefs,
	AppBskyFeedPost,
	AppBskyGraphFollow,
} from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	type ModerationDecision,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';
import { ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import * as TID from '@atcute/tid';
import { Collapsible } from '@base-ui/react/collapsible';
import { plural } from '@lingui/core/macro';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';

import { MAX_POST_LINES } from '#/lib/constants';
import { makeProfileLink } from '#/lib/routes/links';
import type { NavigationProp } from '#/lib/routes/types';
import { forceLTR } from '#/lib/strings/bidi';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { niceDate } from '#/lib/strings/time';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import type { FeedNotification } from '#/state/queries/notifications/feed';
import { useProfileFollowMutationQueue } from '#/state/queries/profile';
import { unstableCacheProfileView } from '#/state/queries/unstable-profile-cache';
import { useClients, useSession } from '#/state/session';

import { logger } from '#/logger';

import { FeedSourceCard } from '#/view/com/feeds/FeedSourceCard';
import { Post } from '#/view/com/post/Post';
import { formatCount } from '#/view/com/util/numeric/format';
import { TimeElapsed } from '#/view/com/util/TimeElapsed';

import { useTheme } from '#/alf';

import { BlockLink } from '#/components/BlockLink';
import { BellRinging_Filled_Corner0_Rounded as BellRingingIcon } from '#/components/icons/BellRinging';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import {
	ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon,
	ChevronTop_Stroke2_Corner0_Rounded as ChevronUpIcon,
} from '#/components/icons/Chevron';
import { Contacts_Filled_Corner2_Rounded as ContactsIconFilled } from '#/components/icons/Contacts';
import { Heart2_Filled_Stroke2_Corner0_Rounded as HeartIconFilled } from '#/components/icons/Heart2';
import { PersonPlus_Filled_Stroke2_Corner0_Rounded as PersonPlusIcon } from '#/components/icons/Person';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import { Repost_Stroke2_Corner3_Rounded as RepostIcon } from '#/components/icons/Repost';
import { StarterPack } from '#/components/icons/StarterPack';
import { VerifiedCheck } from '#/components/icons/VerifiedCheck';
import * as MediaPreview from '#/components/MediaPreview';
import { ProfileBadges } from '#/components/ProfileBadges';
import { Notification as StarterPackCard } from '#/components/StarterPack/StarterPackCard';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { PreviewableUserAvatar } from '#/components/UserAvatar';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import { InlineLinkText } from '#/components/web/Link';
import * as ProfileCard from '#/components/web/ProfileCard';
import { ProfileHoverCard } from '#/components/web/ProfileHoverCard';
import { Tooltip } from '#/components/web/Tooltip';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './NotificationFeedItem.css';

const MAX_AUTHORS = 5;

interface Author {
	profile: AppBskyActorDefs.ProfileView;
	href: string;
	moderation: ModerationDecision;
}

let NotificationFeedItem = ({
	item,
	moderationOpts,
	highlightUnread,
	hideTopBorder,
}: {
	item: FeedNotification;
	moderationOpts: ModerationOptions;
	highlightUnread: boolean;
	hideTopBorder?: boolean;
}): React.ReactNode => {
	const queryClient = useQueryClient();
	const t = useTheme();
	const { t: l, i18n } = useLingui();
	const [isAuthorsExpanded, setIsAuthorsExpanded] = useState<boolean>(false);
	const itemHref = useMemo(() => {
		switch (item.type) {
			case 'post-like':
			case 'repost':
			case 'like-via-repost':
			case 'repost-via-repost': {
				if (item.subjectUri) {
					const urip = parseCanonicalResourceUri(item.subjectUri);
					return `/profile/${urip.repo}/post/${urip.rkey}`;
				}
				break;
			}
			case 'follow':
			case 'contact-match':
			case 'verified':
			case 'unverified': {
				return makeProfileLink(item.notification.author);
			}
			case 'reply':
			case 'mention':
			case 'quote': {
				const uripReply = parseCanonicalResourceUri(item.notification.uri);
				return `/profile/${uripReply.repo}/post/${uripReply.rkey}`;
			}
			case 'feedgen-like': {
				if (item.subjectUri) {
					const urip = parseCanonicalResourceUri(item.subjectUri);
					return `/profile/${urip.repo}/feed/${urip.rkey}`;
				}
				break;
			}
			case 'starterpack-joined': {
				if (item.subjectUri) {
					const urip = parseCanonicalResourceUri(item.subjectUri);
					return `/starter-pack/${urip.repo}/${urip.rkey}`;
				}
				break;
			}
			case 'subscribed-post': {
				const posts: string[] = [];
				for (const post of [item.notification, ...(item.additional ?? [])]) {
					posts.push(post.uri);
				}
				return `/notifications/activity?posts=${encodeURIComponent(posts.slice(0, 25).join(','))}`;
			}
		}

		return '';
	}, [item]);

	const onBeforePress = useCallback(() => {
		unstableCacheProfileView(queryClient, item.notification.author);
	}, [queryClient, item.notification.author]);

	const authors: Author[] = useMemo(() => {
		return [
			{
				profile: item.notification.author as AppBskyActorDefs.ProfileView,
				href: makeProfileLink(item.notification.author),
				moderation: moderateProfile(item.notification.author, moderationOpts),
			},
			...(item.additional?.map(({ author }) => ({
				profile: author,
				href: makeProfileLink(author),
				moderation: moderateProfile(author as AnyProfileView, moderationOpts),
			})) || []),
		].filter((author, index, arr) => arr.findIndex((au) => au.profile.did === author.profile.did) === index);
	}, [item, moderationOpts]);

	const niceTimestamp = niceDate(i18n, item.notification.indexedAt);
	const firstAuthor = authors[0]!;
	const firstAuthorName = sanitizeDisplayName(firstAuthor.profile.displayName || firstAuthor.profile.handle);

	// Calculate if this is a follow-back notification
	const isFollowBack = useMemo(() => {
		if (item.type !== 'follow') return false;
		if (item.notification.author.viewer?.following) {
			const record = item.notification.record as AppBskyGraphFollow.Main;
			let followingTimestamp;
			try {
				const rkey = parseCanonicalResourceUri(item.notification.author.viewer.following).rkey;
				followingTimestamp = TID.parse(rkey).timestamp;
			} catch (e) {
				return false;
			}
			if (followingTimestamp) {
				const followedTimestamp = new Date(record.createdAt).getTime() * 1000;
				return followedTimestamp > followingTimestamp;
			}
		}
		return false;
	}, [item]);

	if (item.subjectUri && !item.subject && item.type !== 'feedgen-like') {
		// don't render anything if the target post was deleted or unfindable
		return null;
	}

	if (item.type === 'reply' || item.type === 'mention' || item.type === 'quote') {
		if (!item.subject) {
			return null;
		}
		const isHighlighted = highlightUnread && !item.notification.isRead;
		return (
			<Post
				post={item.subject}
				style={
					isHighlighted
						? {
								backgroundColor: t.palette.primary_25,
								borderColor: t.palette.primary_100,
							}
						: undefined
				}
				hideTopBorder={hideTopBorder}
			/>
		);
	}

	const firstAuthorLink = (
		<ProfileHoverCard did={firstAuthor.profile.did}>
			<InlineLinkText
				key={firstAuthor.href}
				to={firstAuthor.href}
				label={m['view.notifications.a11y.goToProfile']({ firstAuthorName })}
				color="text"
				weight="semiBold"
				size="md"
			>
				{forceLTR(firstAuthorName)}
				<span className={css.badgeWrap}>
					<ProfileBadges profile={firstAuthor.profile} size="md" />
				</span>
			</InlineLinkText>
		</ProfileHoverCard>
	);
	const additionalAuthorsCount = authors.length - 1;
	const hasMultipleAuthors = additionalAuthorsCount > 0;
	const formattedAuthorsCount = hasMultipleAuthors ? formatCount(i18n, additionalAuthorsCount) : '';

	let a11yLabel = '';
	let notificationContent: React.ReactElement;
	let icon = <HeartIconFilled size="lg" fill={colors.pink} />;

	if (item.type === 'post-like') {
		a11yLabel = hasMultipleAuthors
			? l`${firstAuthorName} and ${plural(additionalAuthorsCount, {
					one: `${formattedAuthorsCount} other`,
					other: `${formattedAuthorsCount} others`,
				})} liked your post`
			: m['view.notifications.singleName.likedPost']({ firstAuthorName });
		notificationContent = hasMultipleAuthors ? (
			<Trans>
				{firstAuthorLink} and{' '}
				<Text weight="semiBold">
					<Plural
						value={additionalAuthorsCount}
						one={`${formattedAuthorsCount} other`}
						other={`${formattedAuthorsCount} others`}
					/>
				</Text>{' '}
				liked your post
			</Trans>
		) : (
			<Trans>{firstAuthorLink} liked your post</Trans>
		);
	} else if (item.type === 'repost') {
		a11yLabel = hasMultipleAuthors
			? l`${firstAuthorName} and ${plural(additionalAuthorsCount, {
					one: `${formattedAuthorsCount} other`,
					other: `${formattedAuthorsCount} others`,
				})} reposted your post`
			: m['view.notifications.singleName.repostedPost']({ firstAuthorName });
		notificationContent = hasMultipleAuthors ? (
			<Trans>
				{firstAuthorLink} and{' '}
				<Text weight="semiBold">
					<Plural
						value={additionalAuthorsCount}
						one={`${formattedAuthorsCount} other`}
						other={`${formattedAuthorsCount} others`}
					/>
				</Text>{' '}
				reposted your post
			</Trans>
		) : (
			<Trans>{firstAuthorLink} reposted your post</Trans>
		);
		icon = <RepostIcon size="lg" fill={colors.positive_500} />;
	} else if (item.type === 'follow') {
		if (isFollowBack && !hasMultipleAuthors) {
			/*
			 * Follow-backs are ungrouped, grouped follow-backs not supported atm,
			 * see `src/state/queries/notifications/util.ts`
			 */
			a11yLabel = m['view.notifications.singleName.followedBack']({ firstAuthorName });
			notificationContent = <Trans>{firstAuthorLink} followed you back</Trans>;
		} else {
			a11yLabel = hasMultipleAuthors
				? l`${firstAuthorName} and ${plural(additionalAuthorsCount, {
						one: `${formattedAuthorsCount} other`,
						other: `${formattedAuthorsCount} others`,
					})} followed you`
				: m['view.notifications.singleName.followed']({ firstAuthorName });
			notificationContent = hasMultipleAuthors ? (
				<Trans>
					{firstAuthorLink} and{' '}
					<Text weight="semiBold">
						<Plural
							value={additionalAuthorsCount}
							one={`${formattedAuthorsCount} other`}
							other={`${formattedAuthorsCount} others`}
						/>
					</Text>{' '}
					followed you
				</Trans>
			) : (
				<Trans>{firstAuthorLink} followed you</Trans>
			);
		}
		icon = <PersonPlusIcon size="lg" fill={colors.primary_500} />;
	} else if (item.type === 'contact-match') {
		a11yLabel = m['view.notifications.contact.onBlueskyName']({ firstAuthorName });
		notificationContent = <Trans>Your contact {firstAuthorLink} is on Bluesky</Trans>;
		icon = <ContactsIconFilled size="lg" fill={colors.primary_500} />;
	} else if (item.type === 'feedgen-like') {
		a11yLabel = hasMultipleAuthors
			? l`${firstAuthorName} and ${plural(additionalAuthorsCount, {
					one: `${formattedAuthorsCount} other`,
					other: `${formattedAuthorsCount} others`,
				})} liked your custom feed`
			: m['view.notifications.singleName.likedFeed']({ firstAuthorName });
		notificationContent = hasMultipleAuthors ? (
			<Trans>
				{firstAuthorLink} and{' '}
				<Text weight="semiBold">
					<Plural
						value={additionalAuthorsCount}
						one={`${formattedAuthorsCount} other`}
						other={`${formattedAuthorsCount} others`}
					/>
				</Text>{' '}
				liked your custom feed
			</Trans>
		) : (
			<Trans>{firstAuthorLink} liked your custom feed</Trans>
		);
	} else if (item.type === 'starterpack-joined') {
		a11yLabel = hasMultipleAuthors
			? l`${firstAuthorName} and ${plural(additionalAuthorsCount, {
					one: `${formattedAuthorsCount} other`,
					other: `${formattedAuthorsCount} others`,
				})} signed up with your starter pack`
			: m['view.notifications.singleName.signedUp']({ firstAuthorName });
		notificationContent = hasMultipleAuthors ? (
			<Trans>
				{firstAuthorLink} and{' '}
				<Text weight="semiBold">
					<Plural
						value={additionalAuthorsCount}
						one={`${formattedAuthorsCount} other`}
						other={`${formattedAuthorsCount} others`}
					/>
				</Text>{' '}
				signed up with your starter pack
			</Trans>
		) : (
			<Trans>{firstAuthorLink} signed up with your starter pack</Trans>
		);
		icon = <StarterPack width={24} gradient="sky" />;
	} else if (item.type === 'verified') {
		a11yLabel = hasMultipleAuthors
			? l`${firstAuthorName} and ${plural(additionalAuthorsCount, {
					one: `${formattedAuthorsCount} other`,
					other: `${formattedAuthorsCount} others`,
				})} verified you`
			: m['view.notifications.singleName.verified']({ firstAuthorName });
		notificationContent = hasMultipleAuthors ? (
			<Trans>
				{firstAuthorLink} and{' '}
				<Text weight="semiBold">
					<Plural
						value={additionalAuthorsCount}
						one={`${formattedAuthorsCount} other`}
						other={`${formattedAuthorsCount} others`}
					/>
				</Text>{' '}
				verified you
			</Trans>
		) : (
			<Trans>{firstAuthorLink} verified you</Trans>
		);
		icon = <VerifiedCheck size="xl" />;
	} else if (item.type === 'unverified') {
		a11yLabel = hasMultipleAuthors
			? l`${firstAuthorName} and ${plural(additionalAuthorsCount, {
					one: `${formattedAuthorsCount} other`,
					other: `${formattedAuthorsCount} others`,
				})} removed their verifications from your account`
			: m['view.notifications.singleName.removedVerification']({ firstAuthorName });
		notificationContent = hasMultipleAuthors ? (
			<Trans>
				{firstAuthorLink} and{' '}
				<Text weight="semiBold">
					<Plural
						value={additionalAuthorsCount}
						one={`${formattedAuthorsCount} other`}
						other={`${formattedAuthorsCount} others`}
					/>
				</Text>{' '}
				removed their verifications from your account
			</Trans>
		) : (
			<Trans>{firstAuthorLink} removed their verification from your account</Trans>
		);
		icon = <VerifiedCheck size="xl" fill={colors.contrast_500} />;
	} else if (item.type === 'like-via-repost') {
		a11yLabel = hasMultipleAuthors
			? l`${firstAuthorName} and ${plural(additionalAuthorsCount, {
					one: `${formattedAuthorsCount} other`,
					other: `${formattedAuthorsCount} others`,
				})} liked your repost`
			: m['view.notifications.singleName.likedRepost']({ firstAuthorName });
		notificationContent = hasMultipleAuthors ? (
			<Trans>
				{firstAuthorLink} and{' '}
				<Text weight="semiBold">
					<Plural
						value={additionalAuthorsCount}
						one={`${formattedAuthorsCount} other`}
						other={`${formattedAuthorsCount} others`}
					/>
				</Text>{' '}
				liked your repost
			</Trans>
		) : (
			<Trans>{firstAuthorLink} liked your repost</Trans>
		);
	} else if (item.type === 'repost-via-repost') {
		a11yLabel = hasMultipleAuthors
			? l`${firstAuthorName} and ${plural(additionalAuthorsCount, {
					one: `${formattedAuthorsCount} other`,
					other: `${formattedAuthorsCount} others`,
				})} reposted your repost`
			: m['view.notifications.singleName.repostedRepost']({ firstAuthorName });
		notificationContent = hasMultipleAuthors ? (
			<Trans>
				{firstAuthorLink} and{' '}
				<Text weight="semiBold">
					<Plural
						value={additionalAuthorsCount}
						one={`${formattedAuthorsCount} other`}
						other={`${formattedAuthorsCount} others`}
					/>
				</Text>{' '}
				reposted your repost
			</Trans>
		) : (
			<Trans>{firstAuthorLink} reposted your repost</Trans>
		);
		icon = <RepostIcon size="xl" fill={colors.positive_500} />;
	} else if (item.type === 'subscribed-post') {
		const postsCount = 1 + (item.additional?.length || 0);
		a11yLabel = hasMultipleAuthors
			? l`New posts from ${firstAuthorName} and ${plural(additionalAuthorsCount, {
					one: `${formattedAuthorsCount} other`,
					other: `${formattedAuthorsCount} others`,
				})}`
			: l`New ${plural(postsCount, {
					one: 'post',
					other: 'posts',
				})} from ${firstAuthorName}`;
		notificationContent = hasMultipleAuthors ? (
			<Trans>
				New posts from {firstAuthorLink} and{' '}
				<Text weight="semiBold">
					<Plural
						value={additionalAuthorsCount}
						one={`${formattedAuthorsCount} other`}
						other={`${formattedAuthorsCount} others`}
					/>
				</Text>{' '}
			</Trans>
		) : (
			<Trans>
				New <Plural value={postsCount} one="post" other="posts" /> from {firstAuthorLink}
			</Trans>
		);
		icon = <BellRingingIcon size="xl" fill={colors.primary_500} />;
	} else {
		return null;
	}
	a11yLabel += ` · ${niceTimestamp}`;

	const card = (
		<div className={css.outer({ topBorder: !hideTopBorder, unread: !item.notification.isRead })}>
			<div className={css.iconColumn}>{icon}</div>

			<div className={css.content}>
				<AuthorsList
					authors={authors}
					isExpanded={isAuthorsExpanded}
					onOpenChange={setIsAuthorsExpanded}
					moderationOpts={moderationOpts}
					showDmButton={item.type === 'starterpack-joined'}
				/>

				<Text className={css.notifText}>
					{notificationContent}
					<TimeElapsed timestamp={item.notification.indexedAt}>
						{({ timeElapsed }) => (
							<>
								{/* make sure there's whitespace around the middot -sfn */}
								<Text color="textContrastMedium"> &middot; </Text>
								<Tooltip label={niceTimestamp}>
									<Text color="textContrastMedium">{timeElapsed}</Text>
								</Tooltip>
							</>
						)}
					</TimeElapsed>
				</Text>

				{(item.type === 'follow' && !hasMultipleAuthors && !isFollowBack) ||
				(item.type === 'contact-match' && !item.notification.author.viewer?.following) ? (
					<FollowBackButton profile={item.notification.author} />
				) : null}

				{item.type === 'post-like' ||
				item.type === 'repost' ||
				item.type === 'like-via-repost' ||
				item.type === 'repost-via-repost' ||
				item.type === 'subscribed-post' ? (
					<div className={css.additionalWrap}>
						<AdditionalPostText post={item.subject} />
					</div>
				) : null}

				{item.type === 'feedgen-like' && item.subjectUri ? (
					<FeedSourceCard
						feedUri={item.subjectUri}
						link={false}
						style={[
							t.atoms.bg,
							t.atoms.border_contrast_low,
							{ borderRadius: 8, borderWidth: 1, marginTop: 6, padding: 12 },
						]}
						showLikes
					/>
				) : null}
				{item.type === 'starterpack-joined' ? (
					<div className={css.starterPackBox}>
						<StarterPackCard starterPack={item.subject} />
					</div>
				) : null}
			</div>
		</div>
	);

	if (!itemHref) {
		return card;
	}

	return (
		<BlockLink to={itemHref} label={a11yLabel} onBeforePress={onBeforePress}>
			{card}
		</BlockLink>
	);
};
NotificationFeedItem = memo(NotificationFeedItem);
export { NotificationFeedItem };

function AuthorsList({
	authors,
	isExpanded,
	onOpenChange,
	moderationOpts,
	showDmButton,
}: {
	authors: Author[];
	isExpanded: boolean;
	onOpenChange: (open: boolean) => void;
	moderationOpts: ModerationOptions;
	showDmButton: boolean;
}) {
	// a single author needs no toggle: just the avatar (and the say-hello affordance for starter packs)
	if (authors.length < 2) {
		return (
			<div className={css.avatarsRow}>
				<PreviewableUserAvatar
					size={css.NOTIF_AVI_SIZE}
					profile={authors[0]!.profile}
					moderation={getDisplayRestrictions(authors[0]!.moderation, DisplayContext.ProfileMedia)}
					type={authors[0]!.profile.associated?.labeler ? 'labeler' : 'user'}
				/>
				{showDmButton ? <SayHelloBtn profile={authors[0]!.profile} /> : null}
			</div>
		);
	}

	return (
		<Collapsible.Root open={isExpanded} onOpenChange={onOpenChange}>
			<Collapsible.Trigger
				// a non-native button so the trigger can hold the interactive previewable avatars. Base UI's
				// trigger toggles on every click and ignores a child's `preventDefault`, so a click on a nested
				// avatar link would both navigate to that profile and expand the list. Suppress the toggle
				// whenever the press lands on a nested interactive element rather than the chevron/label.
				nativeButton={false}
				render={<div />}
				className={css.authorsTrigger}
				aria-label={
					isExpanded
						? m['view.notifications.a11y.collapseUsers']()
						: m['view.notifications.a11y.expandUsers']()
				}
				onClick={(event) => {
					const interactive = (event.target as HTMLElement).closest('a, button');
					if (interactive && interactive !== event.currentTarget) {
						event.preventBaseUIHandler();
					}
				}}
			>
				{isExpanded ? (
					<>
						<div className={css.authorChevron}>
							<ChevronUpIcon size="sm" fill={colors.textContrastHigh} />
						</div>
						<Text color="textContrastHigh" weight="semiBold">
							{m['common.action.hide']()}
						</Text>
					</>
				) : (
					<>
						{authors.slice(0, MAX_AUTHORS).map((author) => (
							<PreviewableUserAvatar
								key={author.href}
								size={css.NOTIF_AVI_SIZE}
								profile={author.profile}
								moderation={getDisplayRestrictions(author.moderation, DisplayContext.ProfileMedia)}
								type={author.profile.associated?.labeler ? 'labeler' : 'user'}
							/>
						))}

						{authors.length > MAX_AUTHORS ? (
							<Text weight="semiBold" color="textContrastMedium" className={css.moreCount}>
								+{authors.length - MAX_AUTHORS}
							</Text>
						) : null}

						<div className={css.authorChevron}>
							<ChevronDownIcon size="sm" fill={colors.textContrastMedium} />
						</div>
					</>
				)}
			</Collapsible.Trigger>

			<Collapsible.Panel className={css.expandPanel}>
				<div className={css.expandContent}>
					{authors.map((author, i) => (
						<ExpandedAuthorProfileCard
							key={author.profile.did}
							author={author}
							moderationOpts={moderationOpts}
							isLast={i === authors.length - 1}
						/>
					))}
				</div>
			</Collapsible.Panel>
		</Collapsible.Root>
	);
}

function FollowBackButton({ profile }: { profile: AppBskyActorDefs.ProfileView }) {
	const { currentAccount, hasSession } = useSession();
	const profileShadow = useProfileShadow(profile);
	const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(profileShadow);

	// Don't show button if not logged in or for own profile
	if (!hasSession || profile.did === currentAccount?.did) {
		return null;
	}

	const onPressFollow = async (e: MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();

		try {
			await queueFollow();
			Toast.show(
				m['common.a11y.following']({ name: sanitizeDisplayName(profile.displayName || profile.handle) }),
			);
		} catch (err) {
			if (!(err instanceof Error && err.name === 'AbortError')) {
				Toast.show(m['common.error.generic'](), {
					type: 'error',
				});
			}
		}
	};

	const onPressUnfollow = async (e: MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();

		try {
			await queueUnfollow();
			Toast.show(
				m['common.label.noLongerFollowing']({
					name: sanitizeDisplayName(profile.displayName || profile.handle),
				}),
			);
		} catch (err) {
			if (!(err instanceof Error && err.name === 'AbortError')) {
				Toast.show(m['common.error.generic'](), {
					type: 'error',
				});
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
	const followingLabel = m['common.action.following']();

	return (
		<div className={css.followBtnWrap}>
			{isFollowing ? (
				<Button
					label={followingLabel}
					color="secondary"
					size="small"
					onClick={(e) => void onPressUnfollow(e)}
				>
					<ButtonIcon icon={CheckIcon} />
					<ButtonText>{m['common.action.following']()}</ButtonText>
				</Button>
			) : (
				<Button
					label={isFollowedBy ? m['common.action.followBack']() : m['common.action.follow']()}
					color="primary"
					size="small"
					onClick={(e) => void onPressFollow(e)}
				>
					<ButtonIcon icon={PlusIcon} />
					<ButtonText>
						{isFollowedBy ? m['common.action.followBack']() : m['common.action.follow']()}
					</ButtonText>
				</Button>
			)}
		</div>
	);
}

function SayHelloBtn({ profile }: { profile: AppBskyActorDefs.ProfileView }) {
	const { chat } = useClients();
	const { currentAccount } = useSession();
	const navigation = useNavigation<NavigationProp>();
	const [isLoading, setIsLoading] = useState(false);

	const onPressSayHello = async () => {
		if (!chat || !currentAccount) return;
		try {
			setIsLoading(true);
			const data = await ok(
				chat.get('chat.bsky.convo.getConvoForMembers', {
					params: { members: [profile.did, currentAccount.did as Did] },
				}),
			);
			navigation.navigate('MessagesConversation', {
				conversation: data.convo.id,
			});
		} catch (e) {
			logger.error('Failed to get conversation', { safeMessage: e });
		} finally {
			setIsLoading(false);
		}
	};

	if (
		profile.associated?.chat?.allowIncoming === 'none' ||
		(profile.associated?.chat?.allowIncoming === 'following' && !profile.viewer?.followedBy)
	) {
		return null;
	}

	return (
		<Button
			label={m['common.label.sayHello']()}
			variant="ghost"
			color="primary"
			size="small"
			className={css.sayHelloBtn}
			disabled={isLoading}
			onClick={() => void onPressSayHello()}
		>
			<ButtonText>{m['common.label.sayHello']()}</ButtonText>
		</Button>
	);
}

function ExpandedAuthorProfileCard({
	author,
	moderationOpts,
	isLast,
}: {
	author: Author;
	moderationOpts: ModerationOptions;
	isLast: boolean;
}) {
	const profile = useProfileShadow(author.profile);
	const isFollowing = !!profile.viewer?.following;
	return (
		<ProfileCard.Link profile={author.profile} className={isLast ? undefined : css.expandCardGap}>
			<ProfileCard.Outer>
				<ProfileCard.Header>
					<ProfileCard.Avatar profile={author.profile} moderationOpts={moderationOpts} />
					<ProfileCard.NameAndHandle profile={author.profile} moderationOpts={moderationOpts} />
					<ProfileCard.FollowButton
						profile={author.profile}
						moderationOpts={moderationOpts}
						size="small"
						variant={isFollowing ? 'ghost' : 'solid'}
						color={isFollowing ? 'secondary' : 'primary_subtle'}
						withIcon={isFollowing}
					/>
				</ProfileCard.Header>
			</ProfileCard.Outer>
		</ProfileCard.Link>
	);
}

function AdditionalPostText({ post }: { post?: AppBskyFeedDefs.PostView }) {
	if (!post) {
		return null;
	}
	const record = post.record as AppBskyFeedPost.Main;
	const text = record.text;

	return (
		<>
			{text?.length > 0 && (
				<Text size="md_sub" color="textContrastMedium" numberOfLines={MAX_POST_LINES}>
					{text}
				</Text>
			)}

			<MediaPreview.Embed embed={post.embed} style={{ marginLeft: 2, marginTop: 5, opacity: 0.8 }} />
		</>
	);
}
