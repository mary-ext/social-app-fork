import { useEffect, useState } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';

import { definite } from '@mary/array-fns';

import { useQueryClient } from '@tanstack/react-query';

import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { useTitle } from '#/lib/hooks/useTitle';
import { profileTarget } from '#/lib/routes/targets';
import { combinedDisplayName } from '#/lib/strings/display-names';
import { cleanError } from '#/lib/strings/errors';
import { isInvalidHandle } from '#/lib/strings/handles';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { softReset } from '#/state/events';
import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { resetProfilePostsQueries } from '#/state/queries/post-feed';
import { useProfileQuery } from '#/state/queries/profile';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';
import { useSession } from '#/state/session';

import { ProfileFeedgens } from '#/screens/Profile/components/ProfileFeedgens';
import { ProfileLists } from '#/screens/Profile/components/ProfileLists';
import { ProfileHeader } from '#/screens/Profile/Header';
import { ProfileHeaderSkeleton } from '#/screens/Profile/Header/Skeleton';
import { ProfileFeedSection } from '#/screens/Profile/Sections/Feed';

import { ErrorScreen } from '#/components/ErrorScreen';
import { FAB } from '#/components/FAB';
import { useRichText } from '#/components/hooks/useRichText';
import { ScreenHider } from '#/components/moderation/ScreenHider';
import { ProfileStarterPacks } from '#/components/StarterPack/ProfileStarterPacks';
import { type Section, Tabs } from '#/components/Tabs';
import * as Layout from '#/components/web/Layout';

import MessageIcon from '#/icons/central/Bubble2_round_outlined_radius1_stroke2.svg';
import EditBigIcon from '#/icons/central/EditBig_round_outlined_radius1_stroke2.svg';
import HeartIcon from '#/icons/central/Heart_round_outlined_radius1_stroke1.svg';
import ImageIcon from '#/icons/central/Images1_round_outlined_radius1_stroke1.svg';
import VideoIcon from '#/icons/central/VideoClip_round_outlined_radius3_stroke1.svg';
import CircleAndSquareIcon from '#/icons/original/CircleAndSquare.svg';
import { m } from '#/paraglide/messages';
import { useFocusEffect, useParams, useRouter } from '#/routes';

import * as css from './index.css';

export function ProfileScreen() {
	return (
		<Layout.Screen noInsetTop>
			<ProfileScreenInner />
		</Layout.Screen>
	);
}

function ProfileScreenInner() {
	const queryClient = useQueryClient();
	const router = useRouter();
	const [{ actor }] = useParams('Profile');
	const moderationOpts = useModerationOpts();
	const {
		data: resolvedDid,
		error: resolveError,
		refetch: refetchDid,
		isPending: isDidPending,
	} = useResolveDidQuery(actor);
	const {
		data: profile,
		error: profileError,
		refetch: refetchProfile,
		isPlaceholderData: isPlaceholderProfile,
		isPending: isProfilePending,
	} = useProfileQuery({
		did: resolvedDid,
	});

	const onPressTryAgain = () => {
		if (resolveError) {
			void refetchDid();
		} else {
			void refetchProfile();
		}
	};

	// Apply hard-coded redirects as need
	useEffect(() => {
		if (resolveError) {
			if (actor === 'lulaoficial.bsky.social') {
				console.log('Applying redirect to lula.com.br');
				router.navigate({ to: profileTarget('lula.com.br') });
			}
		}
	}, [actor, resolveError, router]);

	// When we open the profile, we want to reset the posts query if we are blocked.
	useEffect(() => {
		if (resolvedDid && profile?.viewer?.blockedBy) {
			resetProfilePostsQueries(queryClient, resolvedDid);
		}
	}, [queryClient, profile?.viewer?.blockedBy, resolvedDid]);

	// Most pushes will happen here, since we will have only placeholder data
	if (isDidPending || isProfilePending) {
		return (
			<Layout.Content>
				<ProfileHeaderSkeleton />
			</Layout.Content>
		);
	}
	if (resolveError || profileError) {
		return (
			<ErrorScreen
				title={profileError ? m['common.error.notFound']() : m['common.error.oops']()}
				message={cleanError(resolveError || profileError)}
				onPressTryAgain={onPressTryAgain}
				showHeader
			/>
		);
	}
	if (profile && moderationOpts) {
		return (
			<ProfileScreenLoaded
				profile={profile}
				moderationOpts={moderationOpts}
				isPlaceholderProfile={isPlaceholderProfile}
			/>
		);
	}
	// should never happen
	return (
		<ErrorScreen
			title="Oops!"
			message="Something went wrong and we're not sure what."
			onPressTryAgain={onPressTryAgain}
			showHeader
		/>
	);
}

function ProfileScreenLoaded({
	profile: profileUnshadowed,
	isPlaceholderProfile,
	moderationOpts,
}: {
	profile: AppBskyActorDefs.ProfileViewDetailed;
	moderationOpts: ModerationOptions;
	isPlaceholderProfile: boolean;
}) {
	const router = useRouter();
	const { hasSession, currentAccount } = useSession();

	const profile = useProfileShadow(profileUnshadowed);
	const { openComposer } = useOpenComposer();

	const [selectedTab, setSelectedTab] = useState<string | null>(null);

	useTitle(combinedDisplayName(profile));

	const description = profile.description ?? '';
	const hasDescription = description !== '';
	const [descriptionRT, isResolvingDescriptionRT] = useRichText(description);
	const showPlaceholder = isPlaceholderProfile || isResolvingDescriptionRT;
	const isHeaderReady = !showPlaceholder;
	const moderation = moderateProfile(profile, moderationOpts);

	const isMe = profile.did === currentAccount?.did;
	const showLikesTab = isMe;

	const feedCount = profile.associated?.feedgens || 0;
	const showFeedsTab = isMe || feedCount > 0;

	const starterPackCount = profile.associated?.starterPacks || 0;
	const showStarterPacksTab = isMe || starterPackCount > 0;

	const listCount = (profile.associated?.lists || 0) - starterPackCount;
	const showListsTab = isMe || listCount > 0;

	const onPressCompose = () => {
		const mention =
			profile.handle === currentAccount?.handle || isInvalidHandle(profile.handle)
				? undefined
				: profile.handle;
		openComposer({ mention });
	};

	const navToWizard = () => {
		router.navigate({ to: { name: 'StarterPackWizard' } });
	};

	const sections = definite<Section<string>>([
		{
			id: 'posts',
			label: m['common.post.label'](),
			children: (
				<ProfileFeedSection
					feed={`author|${profile.did}|posts_and_author_threads`}
					ignoreFilterFor={profile.did}
					emptyStateMessage={m['common.post.empty']()}
					emptyStateButton={
						isMe
							? {
									label: m['common.compose.action.writePost'](),
									text: m['common.compose.action.writePost'](),
									onPress: () => openComposer({}),
									size: 'small',
									color: 'primary',
								}
							: undefined
					}
				/>
			),
		},
		{
			id: 'replies',
			label: m['common.reply.label'](),
			children: (
				<ProfileFeedSection
					feed={`author|${profile.did}|posts_with_replies`}
					ignoreFilterFor={profile.did}
					emptyStateMessage={m['common.reply.empty']()}
					emptyStateIcon={MessageIcon}
				/>
			),
		},
		{
			id: 'media',
			label: m['common.media.label'](),
			children: (
				<ProfileFeedSection
					feed={`author|${profile.did}|posts_with_media`}
					ignoreFilterFor={profile.did}
					emptyStateMessage={m['common.media.empty']()}
					emptyStateButton={
						isMe
							? {
									label: m['common.compose.action.photo'](),
									text: m['common.compose.action.photo'](),
									onPress: () => openComposer({}),
									size: 'small',
									color: 'primary',
								}
							: undefined
					}
					emptyStateIcon={ImageIcon}
				/>
			),
		},
		{
			id: 'videos',
			label: m['common.video.label'](),
			children: (
				<ProfileFeedSection
					feed={`author|${profile.did}|posts_with_video`}
					ignoreFilterFor={profile.did}
					emptyStateMessage={m['common.video.empty']()}
					emptyStateButton={
						isMe
							? {
									label: m['common.compose.action.video'](),
									text: m['common.compose.action.video'](),
									onPress: () => openComposer({}),
									size: 'small',
									color: 'primary',
								}
							: undefined
					}
					emptyStateIcon={VideoIcon}
				/>
			),
		},
		showLikesTab && {
			id: 'likes',
			label: m['common.like.label'](),
			children: (
				<ProfileFeedSection
					feed={`likes|${profile.did}`}
					ignoreFilterFor={profile.did}
					emptyStateMessage={m['common.like.empty']()}
					emptyStateIcon={HeartIcon}
				/>
			),
		},
		showFeedsTab && {
			id: 'feeds',
			label: m['common.nav.feeds'](),
			children: <ProfileFeedgens did={profile.did} feedCount={feedCount} />,
		},
		showStarterPacksTab && {
			id: 'starterPacks',
			label: m['common.starterPack.sectionTitle'](),
			children: (
				<ProfileStarterPacks
					did={profile.did}
					isMe={isMe}
					starterPackCount={starterPackCount}
					emptyStateMessage={
						isMe ? m['components.starterPack.list.empty']() : m['common.starterPack.empty']()
					}
					emptyStateButton={
						isMe
							? {
									label: m['common.starterPack.action.create'](),
									text: m['common.starterPack.action.create'](),
									onPress: navToWizard,
									color: 'primary',
									size: 'small',
								}
							: undefined
					}
					emptyStateIcon={CircleAndSquareIcon}
				/>
			),
		},
		showListsTab && {
			id: 'lists',
			label: m['common.list.label'](),
			children: <ProfileLists did={profile.did} listCount={listCount} />,
		},
	]);

	// the selected tab, falling back to the first section until the user picks one (`showPostsTab` is
	// always true, so the list is never empty)
	// the profile is window-scrolled, so soft-reset just returns the page to the top
	useFocusEffect(() => softReset.subscribe(() => window.scrollTo(0, 0)));

	return (
		<ScreenHider
			className={css.container}
			screenDescription={m['components.moderation.screenHider.user']()}
			modui={getDisplayRestrictions(moderation, DisplayContext.ProfileView)}
		>
			<Tabs
				// the tab set isn't known until the real profile loads, so hold the bar back until then
				sections={isHeaderReady ? sections : []}
				value={selectedTab ?? ''}
				onValueChange={setSelectedTab}
				header={
					<ProfileHeader
						profile={profile}
						descriptionRT={hasDescription ? descriptionRT : null}
						moderationOpts={moderationOpts}
						isPlaceholderProfile={showPlaceholder}
					/>
				}
			/>
			{hasSession && (
				<FAB
					icon={<EditBigIcon className={css.editBigIcon} />}
					label={m['common.compose.action.new']()}
					onClick={onPressCompose}
				/>
			)}
		</ScreenHider>
	);
}
