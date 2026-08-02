import { memo, useState } from 'react';

import type {
	AnyProfileView,
	AnyStarterPackView,
	AppBskyActorDefs,
	AppBskyFeedDefs,
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
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import * as TID from '@atcute/tid';

import { uniqueBy } from '@mary/array-fns';

import { Collapsible } from '@base-ui/react/collapsible';
import { useQueryClient } from '@tanstack/react-query';

import { getPostRecord, getStarterPackRecord } from '#/lib/api/record-views';
import { MAX_POST_LINES } from '#/lib/constants';
import { feedTarget, postUriToTarget, profileTarget, starterPackTarget } from '#/lib/routes/targets';
import { sanitizeDisplayName } from '#/lib/strings/display-names';
import { isAbortError } from '#/lib/strings/errors';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import type { FeedNotification } from '#/state/queries/notifications/feed';
import { useProfileFollowMutationQueue } from '#/state/queries/profile';
import { unstableCacheProfileView } from '#/state/queries/unstable-profile-cache';
import { getClients, useSession } from '#/state/session';

import { niceDate } from '#/locale/intl/datetime';
import { Trans } from '#/locale/Trans';

import { BlockLink } from '#/components/BlockLink';
import * as FeedCard from '#/components/FeedCard';
import * as MediaPreview from '#/components/MediaPreview';
import { Post } from '#/components/Post/Post';
import { PreviewableUserAvatar } from '#/components/PreviewableUserAvatar';
import { ProfileBadges } from '#/components/ProfileBadges';
import { ProfileHoverCard } from '#/components/ProfileHoverCard';
import {
	Notification as StarterPackCard,
	useStarterPackLink,
} from '#/components/StarterPack/StarterPackCard';
import { Text } from '#/components/Text';
import { TimeElapsed } from '#/components/TimeElapsed';
import * as Toast from '#/components/Toast';
import { Tooltip } from '#/components/Tooltip';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
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
import StarterPack from '#/icons/original/StarterPackSky.svg';
import VerifiedCheck from '#/icons/original/VerifiedCheck.svg';
import { m } from '#/paraglide/messages';
import { type RouteTarget, useRouter } from '#/routes';
import { colors } from '#/styles/colors';

import * as css from './NotificationFeedItem.css';

const MAX_AUTHORS = 5;

interface Author {
	profile: AppBskyActorDefs.ProfileView;
	target: RouteTarget;
	moderation: ModerationDecision;
}

const othersCountMarkup = ({ children }: { children?: React.ReactNode }) => (
	<Text weight="semiBold">{children}</Text>
);

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
	const [isAuthorsExpanded, setIsAuthorsExpanded] = useState<boolean>(false);
	let itemTarget: RouteTarget | undefined;
	switch (item.type) {
		case 'post-like':
		case 'repost':
		case 'like-via-repost':
		case 'repost-via-repost': {
			if (item.subjectUri) {
				itemTarget = postUriToTarget(item.subjectUri);
			}
			break;
		}
		case 'follow':
		case 'contact-match':
		case 'verified':
		case 'unverified': {
			itemTarget = profileTarget(item.notification.author.did);
			break;
		}
		case 'reply':
		case 'mention':
		case 'quote': {
			itemTarget = postUriToTarget(item.notification.uri);
			break;
		}
		case 'feedgen-like': {
			if (item.subjectUri) {
				const urip = parseCanonicalResourceUri(item.subjectUri);
				itemTarget = feedTarget(urip.repo, urip.rkey);
			}
			break;
		}
		case 'starterpack-joined': {
			if (item.subjectUri) {
				const urip = parseCanonicalResourceUri(item.subjectUri);
				itemTarget = starterPackTarget(urip.repo, urip.rkey);
			}
			break;
		}
		case 'subscribed-post': {
			const posts: string[] = [];
			for (const post of [item.notification, ...(item.additional ?? [])]) {
				posts.push(post.uri);
			}
			// the activity screen takes the subject posts as a comma-joined query parameter, capped at 25.
			itemTarget = { name: 'NotificationsActivityList', posts: posts.slice(0, 25).join(',') };
			break;
		}
	}

	const onBeforePress = () => {
		unstableCacheProfileView(queryClient, item.notification.author);
	};

	const authors: Author[] = uniqueBy(
		[
			{
				profile: item.notification.author,
				target: profileTarget(item.notification.author.did),
				moderation: moderateProfile(item.notification.author, moderationOpts),
			},
			...(item.additional?.map(({ author }) => ({
				profile: author,
				target: profileTarget(author.did),
				moderation: moderateProfile(author as AnyProfileView, moderationOpts),
			})) || []),
		],
		(author) => author.profile.did,
	);

	const niceTimestamp = niceDate(item.notification.indexedAt);
	const firstAuthor = authors[0]!;
	const firstAuthorName = sanitizeDisplayName(firstAuthor.profile.displayName || firstAuthor.profile.handle);

	// Calculate if this is a follow-back notification
	let isFollowBack = false;
	if (item.type === 'follow' && item.notification.author.viewer?.following) {
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the `follow` item type fixes the collection
		const record = item.notification.record as AppBskyGraphFollow.Main;
		try {
			const rkey = parseCanonicalResourceUri(item.notification.author.viewer.following).rkey;
			const followingTimestamp = TID.parse(rkey).timestamp;
			if (followingTimestamp) {
				const followedTimestamp = new Date(record.createdAt).getTime() * 1000;
				isFollowBack = followedTimestamp > followingTimestamp;
			}
		} catch {
			isFollowBack = false;
		}
	}

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
								backgroundColor: colors.primary_25,
								borderColor: colors.primary_100,
							}
						: undefined
				}
				hideTopBorder={hideTopBorder}
			/>
		);
	}

	const authorLinkMarkup = ({ children }: { children?: React.ReactNode }) => (
		<ProfileHoverCard did={firstAuthor.profile.did}>
			<InlineLinkText
				key={firstAuthor.profile.did}
				to={firstAuthor.target}
				label={m['view.notifications.a11y.goToProfile']({ name: firstAuthorName })}
				className={css.authorName}
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
	const additionalAuthorsCount = authors.length - 1;
	const hasMultipleAuthors = additionalAuthorsCount > 0;

	// grouping already splits follows by starter pack, so the `every` only guards against a stale group
	const starterPack = item.notification.starterPack;
	const starterPackName =
		item.type === 'follow' &&
		starterPack !== undefined &&
		(item.additional ?? []).every((notif) => notif.starterPack?.uri === starterPack.uri)
			? getStarterPackRecord(starterPack).name
			: undefined;

	let a11yLabel = '';
	let notificationContent: React.ReactElement;
	let icon = <HeartIconFilled className={css.heartIconFilledIcon} />;

	if (item.type === 'post-like') {
		a11yLabel = hasMultipleAuthors
			? m['view.notifications.like.post.multiName']({
					count: additionalAuthorsCount,
					name: firstAuthorName,
				})
			: m['view.notifications.like.post.singleName']({ name: firstAuthorName });
		notificationContent = hasMultipleAuthors ? (
			<Trans
				message={m['view.notifications.like.post.multiLink']}
				inputs={{ count: additionalAuthorsCount, name: firstAuthorName }}
				markup={{ authorLink: authorLinkMarkup, t0: othersCountMarkup }}
			/>
		) : (
			<Trans
				message={m['view.notifications.like.post.singleLink']}
				inputs={{ name: firstAuthorName }}
				markup={{ authorLink: authorLinkMarkup }}
			/>
		);
	} else if (item.type === 'repost') {
		a11yLabel = hasMultipleAuthors
			? m['view.notifications.repost.post.multiName']({
					count: additionalAuthorsCount,
					name: firstAuthorName,
				})
			: m['view.notifications.repost.post.singleName']({ name: firstAuthorName });
		notificationContent = hasMultipleAuthors ? (
			<Trans
				message={m['view.notifications.repost.post.multiLink']}
				inputs={{ count: additionalAuthorsCount, name: firstAuthorName }}
				markup={{ authorLink: authorLinkMarkup, t0: othersCountMarkup }}
			/>
		) : (
			<Trans
				message={m['view.notifications.repost.post.singleLink']}
				inputs={{ name: firstAuthorName }}
				markup={{ authorLink: authorLinkMarkup }}
			/>
		);
		icon = <RepostIcon className={css.repostIcon} />;
	} else if (item.type === 'follow') {
		if (isFollowBack && !hasMultipleAuthors) {
			/*
			 * Follow-backs are ungrouped, grouped follow-backs not supported atm,
			 * see `src/state/queries/notifications/util.ts`
			 */
			a11yLabel = m['view.notifications.follow.back.singleName']({ name: firstAuthorName });
			notificationContent = (
				<Trans
					message={m['view.notifications.follow.back.singleLink']}
					inputs={{ name: firstAuthorName }}
					markup={{ authorLink: authorLinkMarkup }}
				/>
			);
		} else {
			a11yLabel = hasMultipleAuthors
				? m['view.notifications.follow.multiName']({
						count: additionalAuthorsCount,
						name: firstAuthorName,
					})
				: m['view.notifications.follow.singleName']({ name: firstAuthorName });
			notificationContent = hasMultipleAuthors ? (
				<Trans
					message={m['view.notifications.follow.multiLink']}
					inputs={{ count: additionalAuthorsCount, name: firstAuthorName }}
					markup={{ authorLink: authorLinkMarkup, t0: othersCountMarkup }}
				/>
			) : (
				<Trans
					message={m['view.notifications.follow.singleLink']}
					inputs={{ name: firstAuthorName }}
					markup={{ authorLink: authorLinkMarkup }}
				/>
			);
		}
		icon = <PersonPlusIcon className={css.avatarBadgeIcon} />;
	} else if (item.type === 'contact-match') {
		a11yLabel = m['view.notifications.contact.singleName']({ name: firstAuthorName });
		notificationContent = (
			<Trans
				message={m['view.notifications.contact.singleLink']}
				inputs={{ name: firstAuthorName }}
				markup={{ authorLink: authorLinkMarkup }}
			/>
		);
		icon = <ContactsIconFilled className={css.avatarBadgeIcon} />;
	} else if (item.type === 'feedgen-like') {
		a11yLabel = hasMultipleAuthors
			? m['view.notifications.like.feed.multiName']({
					count: additionalAuthorsCount,
					name: firstAuthorName,
				})
			: m['view.notifications.like.feed.singleName']({ name: firstAuthorName });
		notificationContent = hasMultipleAuthors ? (
			<Trans
				message={m['view.notifications.like.feed.multiLink']}
				inputs={{ count: additionalAuthorsCount, name: firstAuthorName }}
				markup={{ authorLink: authorLinkMarkup, t0: othersCountMarkup }}
			/>
		) : (
			<Trans
				message={m['view.notifications.like.feed.singleLink']}
				inputs={{ name: firstAuthorName }}
				markup={{ authorLink: authorLinkMarkup }}
			/>
		);
	} else if (item.type === 'starterpack-joined') {
		a11yLabel = hasMultipleAuthors
			? m['view.notifications.starterPack.multiName']({
					count: additionalAuthorsCount,
					name: firstAuthorName,
				})
			: m['view.notifications.starterPack.singleName']({ name: firstAuthorName });
		notificationContent = hasMultipleAuthors ? (
			<Trans
				message={m['view.notifications.starterPack.multiLink']}
				inputs={{ count: additionalAuthorsCount, name: firstAuthorName }}
				markup={{ authorLink: authorLinkMarkup, t0: othersCountMarkup }}
			/>
		) : (
			<Trans
				message={m['view.notifications.starterPack.singleLink']}
				inputs={{ name: firstAuthorName }}
				markup={{ authorLink: authorLinkMarkup }}
			/>
		);
		icon = <StarterPack className={css.starterPackIcon} />;
	} else if (item.type === 'verified') {
		a11yLabel = hasMultipleAuthors
			? m['view.notifications.verification.verified.multiName']({
					count: additionalAuthorsCount,
					name: firstAuthorName,
				})
			: m['view.notifications.verification.verified.singleName']({ name: firstAuthorName });
		notificationContent = hasMultipleAuthors ? (
			<Trans
				message={m['view.notifications.verification.verified.multiLink']}
				inputs={{ count: additionalAuthorsCount, name: firstAuthorName }}
				markup={{ authorLink: authorLinkMarkup, t0: othersCountMarkup }}
			/>
		) : (
			<Trans
				message={m['view.notifications.verification.verified.singleLink']}
				inputs={{ name: firstAuthorName }}
				markup={{ authorLink: authorLinkMarkup }}
			/>
		);
		icon = <VerifiedCheck className={css.verifiedCheckIcon} />;
	} else if (item.type === 'unverified') {
		a11yLabel = hasMultipleAuthors
			? m['view.notifications.verification.removed.multiName']({
					count: additionalAuthorsCount,
					name: firstAuthorName,
				})
			: m['view.notifications.verification.removed.singleName']({ name: firstAuthorName });
		notificationContent = hasMultipleAuthors ? (
			<Trans
				message={m['view.notifications.verification.removed.multiLink']}
				inputs={{ count: additionalAuthorsCount, name: firstAuthorName }}
				markup={{ authorLink: authorLinkMarkup, t0: othersCountMarkup }}
			/>
		) : (
			<Trans
				message={m['view.notifications.verification.removed.singleLink']}
				inputs={{ name: firstAuthorName }}
				markup={{ authorLink: authorLinkMarkup }}
			/>
		);
		icon = <VerifiedCheck className={css.verifiedCheckIcon2} />;
	} else if (item.type === 'like-via-repost') {
		a11yLabel = hasMultipleAuthors
			? m['view.notifications.like.repost.multiName']({
					count: additionalAuthorsCount,
					name: firstAuthorName,
				})
			: m['view.notifications.like.repost.singleName']({ name: firstAuthorName });
		notificationContent = hasMultipleAuthors ? (
			<Trans
				message={m['view.notifications.like.repost.multiLink']}
				inputs={{ count: additionalAuthorsCount, name: firstAuthorName }}
				markup={{ authorLink: authorLinkMarkup, t0: othersCountMarkup }}
			/>
		) : (
			<Trans
				message={m['view.notifications.like.repost.singleLink']}
				inputs={{ name: firstAuthorName }}
				markup={{ authorLink: authorLinkMarkup }}
			/>
		);
	} else if (item.type === 'repost-via-repost') {
		a11yLabel = hasMultipleAuthors
			? m['view.notifications.repost.repost.multiName']({
					count: additionalAuthorsCount,
					name: firstAuthorName,
				})
			: m['view.notifications.repost.repost.singleName']({ name: firstAuthorName });
		notificationContent = hasMultipleAuthors ? (
			<Trans
				message={m['view.notifications.repost.repost.multiLink']}
				inputs={{ count: additionalAuthorsCount, name: firstAuthorName }}
				markup={{ authorLink: authorLinkMarkup, t0: othersCountMarkup }}
			/>
		) : (
			<Trans
				message={m['view.notifications.repost.repost.singleLink']}
				inputs={{ name: firstAuthorName }}
				markup={{ authorLink: authorLinkMarkup }}
			/>
		);
		icon = <RepostIcon className={css.repostIcon2} />;
	} else if (item.type === 'subscribed-post') {
		const postsCount = 1 + (item.additional?.length || 0);
		a11yLabel = hasMultipleAuthors
			? m['view.notifications.newPosts.multiName']({
					count: additionalAuthorsCount,
					name: firstAuthorName,
				})
			: m['view.notifications.newPosts.singleName']({ name: firstAuthorName, count: postsCount });
		notificationContent = hasMultipleAuthors ? (
			<Trans
				message={m['view.notifications.newPosts.multiLink']}
				inputs={{ count: additionalAuthorsCount, name: firstAuthorName }}
				markup={{ authorLink: authorLinkMarkup, t0: othersCountMarkup }}
			/>
		) : (
			<Trans
				message={m['view.notifications.newPosts.singleLink']}
				inputs={{ name: firstAuthorName, count: postsCount }}
				markup={{ authorLink: authorLinkMarkup }}
			/>
		);
		icon = <BellRingingIcon className={css.bellRingingIcon} />;
	} else {
		return null;
	}
	if (starterPackName !== undefined) {
		a11yLabel += ` ${m['view.notifications.follow.viaStarterPack.a11y']({ name: starterPackName })}`;
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
					<div className={css.feedCardWrap}>
						<FeedCard.ByUri uri={item.subjectUri} />
					</div>
				) : null}
				{item.type === 'starterpack-joined' ? (
					<div className={css.starterPackBox}>
						<StarterPackCard starterPack={item.subject} />
					</div>
				) : null}
			</div>
		</div>
	);

	if (!itemTarget) {
		return card;
	}

	return (
		<BlockLink to={itemTarget} label={a11yLabel} onBeforePress={onBeforePress}>
			{card}
		</BlockLink>
	);
};
NotificationFeedItem = memo(NotificationFeedItem);
export { NotificationFeedItem };

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
					const interactive = event.target instanceof Element ? event.target.closest('a, button') : null;
					if (interactive && interactive !== event.currentTarget) {
						event.preventBaseUIHandler();
					}
				}}
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
						{authors.slice(0, MAX_AUTHORS).map((author) => (
							<PreviewableUserAvatar
								key={author.profile.did}
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
							<ChevronDownIcon className={css.chevronDownIcon} />
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

	const onPressFollow = async () => {
		try {
			await queueFollow();
			Toast.show(
				m['common.follow.a11y.following']({
					name: sanitizeDisplayName(profile.displayName || profile.handle),
				}),
			);
		} catch (err) {
			if (!isAbortError(err)) {
				Toast.show(m['common.error.generic'](), {
					type: 'error',
				});
			}
		}
	};

	const onPressUnfollow = async () => {
		try {
			await queueUnfollow();
			Toast.show(
				m['common.follow.noLongerFollowing']({
					name: sanitizeDisplayName(profile.displayName || profile.handle),
				}),
			);
		} catch (err) {
			if (!isAbortError(err)) {
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
	const followingLabel = m['common.follow.action.following']();

	return (
		<div className={css.followBtnWrap}>
			{isFollowing ? (
				<Button label={followingLabel} color="secondary" size="small" onClick={() => void onPressUnfollow()}>
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
	);
}

function SayHelloBtn({ profile }: { profile: AppBskyActorDefs.ProfileView }) {
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

function ExpandedAuthorProfileCard({
	author,
	moderationOpts,
	isLast,
}: {
	author: Author;
	moderationOpts: ModerationOptions;
	isLast: boolean;
}) {
	return (
		<ProfileCard.Link profile={author.profile} className={isLast ? undefined : css.expandCardGap}>
			<ProfileCard.Outer>
				<ProfileCard.Header>
					<ProfileCard.Avatar profile={author.profile} moderationOpts={moderationOpts} />
					<ProfileCard.NameAndHandle profile={author.profile} moderationOpts={moderationOpts} />
					<ProfileCard.FollowButton
						profile={author.profile}
						moderationOpts={moderationOpts}
						variant="subtle"
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
	const record = getPostRecord(post);
	const text = record.text;

	return (
		<>
			{text?.length > 0 && (
				<Text size="md_sub" color="textContrastMedium" numberOfLines={MAX_POST_LINES}>
					{text}
				</Text>
			)}

			<MediaPreview.Embed embed={post.embed} className={css.additionalPostEmbed} />
		</>
	);
}
