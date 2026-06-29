import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppBskyActorDefs } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';

import { definite } from '#/lib/functions';
import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { useSetTitle } from '#/lib/hooks/useSetTitle';
import type { CommonNavigatorParams, NativeStackScreenProps, NavigationProp } from '#/lib/routes/types';
import { combinedDisplayName } from '#/lib/strings/display-names';
import { cleanError } from '#/lib/strings/errors';
import { isInvalidHandle } from '#/lib/strings/handles';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { softReset } from '#/state/events';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useLabelerInfoQuery } from '#/state/queries/labeler';
import { resetProfilePostsQueries } from '#/state/queries/post-feed';
import { useProfileQuery } from '#/state/queries/profile';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';
import { useSession } from '#/state/session';

import { ProfileFeedgens } from '#/view/com/feeds/ProfileFeedgens';
import { ProfileLists } from '#/view/com/lists/ProfileLists';
import { ErrorScreen } from '#/view/com/util/error/ErrorScreen';
import { FAB } from '#/view/com/util/fab/FAB';

import { ProfileHeader, ProfileHeaderSkeleton } from '#/screens/Profile/Header';
import { ProfileFeedSection } from '#/screens/Profile/Sections/Feed';
import { ProfileLabelsSection } from '#/screens/Profile/Sections/Labels';

import { useRichText } from '#/components/hooks/useRichText';
import { Circle_And_Square_Stroke1_Corner0_Rounded_Filled as CircleAndSquareIcon } from '#/components/icons/CircleAndSquare';
import { EditBig_Stroke2_Corner2_Rounded as EditBigIcon } from '#/components/icons/EditBig';
import { Heart2_Stroke1_Corner0_Rounded as HeartIcon } from '#/components/icons/Heart2';
import { Image_Stroke1_Corner0_Rounded as ImageIcon } from '#/components/icons/Image';
import { Message_Stroke1_Corner0_Rounded_Filled as MessageIcon } from '#/components/icons/Message';
import { VideoClip_Stroke1_Corner0_Rounded as VideoIcon } from '#/components/icons/VideoClip';
import { ScreenHider } from '#/components/moderation/ScreenHider';
import { ProfileStarterPacks } from '#/components/StarterPack/ProfileStarterPacks';
import { type Section, Tabs } from '#/components/Tabs';
import * as Layout from '#/components/web/Layout';

import { navigate } from '#/Navigation';
import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './Profile.css';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Profile'>;
export function ProfileScreen(props: Props) {
	return (
		<Layout.Screen noInsetTop>
			<ProfileScreenInner {...props} />
		</Layout.Screen>
	);
}

function ProfileScreenInner({ route }: Props) {
	const { currentAccount } = useSession();
	const queryClient = useQueryClient();
	const name = route.params.name === 'me' ? currentAccount?.did : route.params.name;
	const moderationOpts = useModerationOpts();
	const {
		data: resolvedDid,
		error: resolveError,
		refetch: refetchDid,
		isPending: isDidPending,
	} = useResolveDidQuery(name);
	const {
		data: profile,
		error: profileError,
		refetch: refetchProfile,
		isPlaceholderData: isPlaceholderProfile,
		isPending: isProfilePending,
	} = useProfileQuery({
		did: resolvedDid,
	});

	const onPressTryAgain = useCallback(() => {
		if (resolveError) {
			void refetchDid();
		} else {
			void refetchProfile();
		}
	}, [resolveError, refetchDid, refetchProfile]);

	// Apply hard-coded redirects as need
	useEffect(() => {
		if (resolveError) {
			if (name === 'lulaoficial.bsky.social') {
				console.log('Applying redirect to lula.com.br');
				void navigate('Profile', { name: 'lula.com.br' });
			}
		}
	}, [name, resolveError]);

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
				hideBackButton={!!route.params.hideBackButton}
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
	hideBackButton,
}: {
	profile: AppBskyActorDefs.ProfileViewDetailed;
	moderationOpts: ModerationOptions;
	hideBackButton: boolean;
	isPlaceholderProfile: boolean;
}) {
	const profile = useProfileShadow(profileUnshadowed);
	const { hasSession, currentAccount } = useSession();
	const { openComposer } = useOpenComposer();
	const navigation = useNavigation<NavigationProp>();
	const {
		data: labelerInfo,
		error: labelerError,
		isLoading: isLabelerLoading,
	} = useLabelerInfoQuery({
		did: profile.did,
		enabled: !!profile.associated?.labeler,
	});
	const [selectedTab, setSelectedTab] = useState<string | null>(null);
	useSetTitle(combinedDisplayName(profile));

	const description = profile.description ?? '';
	const hasDescription = description !== '';
	const [descriptionRT, isResolvingDescriptionRT] = useRichText(description);
	const showPlaceholder = isPlaceholderProfile || isResolvingDescriptionRT;
	const isHeaderReady = !showPlaceholder;
	const moderation = useMemo(() => moderateProfile(profile, moderationOpts), [profile, moderationOpts]);

	const isMe = profile.did === currentAccount?.did;
	const hasLabeler = !!profile.associated?.labeler;
	const showFiltersTab = hasLabeler;
	const showPostsTab = true;
	const showRepliesTab = hasSession;
	const showMediaTab = !hasLabeler;
	const showVideosTab = !hasLabeler;
	const showLikesTab = isMe;
	const feedGenCount = profile.associated?.feedgens || 0;
	const showFeedsTab = isMe || feedGenCount > 0;
	const starterPackCount = profile.associated?.starterPacks || 0;
	const showStarterPacksTab = isMe || starterPackCount > 0;
	// subtract starterpack count from list count, since starterpacks are a type of list
	const listCount = (profile.associated?.lists || 0) - starterPackCount;
	const showListsTab = hasSession && (isMe || listCount > 0);

	// events
	// =

	const onPressCompose = () => {
		const mention =
			profile.handle === currentAccount?.handle || isInvalidHandle(profile.handle)
				? undefined
				: profile.handle;
		openComposer({ mention, logContext: 'ProfileFeed' });
	};

	const navToWizard = useCallback(() => {
		navigation.navigate('StarterPackWizard', {});
	}, [navigation]);

	// rendering
	// =

	// the tab sections in display order, keyed by a stable `id` — a single source of truth driving the
	// tab bar and the panels. keying by id (not index) keeps the selection and React reconciliation
	// pinned to the right section when the tab set changes (e.g. login toggles Replies/Likes/Lists).
	const sections = definite<Section<string>>([
		showFiltersTab && {
			id: 'labels',
			label: m['common.moderation.labels'](),
			render: () => (
				<ProfileLabelsSection
					labelerInfo={labelerInfo}
					labelerError={labelerError}
					isLabelerLoading={isLabelerLoading}
					moderationOpts={moderationOpts}
				/>
			),
		},
		showListsTab &&
			hasLabeler && {
				id: 'lists',
				label: m['common.list.label'](),
				render: (isFocused: boolean) => (
					<ProfileLists did={profile.did} enabled={isFocused} listCount={listCount} />
				),
			},
		showPostsTab && {
			id: 'posts',
			label: m['common.post.label'](),
			render: (isFocused: boolean) => (
				<ProfileFeedSection
					feed={`author|${profile.did}|posts_and_author_threads`}
					isFocused={isFocused}
					ignoreFilterFor={profile.did}
					emptyStateMessage={m['common.post.empty']()}
					emptyStateButton={
						isMe
							? {
									label: m['common.compose.action.writePost'](),
									text: m['common.compose.action.writePost'](),
									onPress: () => openComposer({ logContext: 'ProfileFeed' }),
									size: 'small',
									color: 'primary',
								}
							: undefined
					}
				/>
			),
		},
		showRepliesTab && {
			id: 'replies',
			label: m['common.reply.label'](),
			render: (isFocused: boolean) => (
				<ProfileFeedSection
					feed={`author|${profile.did}|posts_with_replies`}
					isFocused={isFocused}
					ignoreFilterFor={profile.did}
					emptyStateMessage={m['common.reply.empty']()}
					emptyStateIcon={MessageIcon}
				/>
			),
		},
		showMediaTab && {
			id: 'media',
			label: m['common.media.label'](),
			render: (isFocused: boolean) => (
				<ProfileFeedSection
					feed={`author|${profile.did}|posts_with_media`}
					isFocused={isFocused}
					ignoreFilterFor={profile.did}
					emptyStateMessage={m['common.media.empty']()}
					emptyStateButton={
						isMe
							? {
									label: m['common.compose.action.photo'](),
									text: m['common.compose.action.photo'](),
									onPress: () => openComposer({ logContext: 'ProfileFeed' }),
									size: 'small',
									color: 'primary',
								}
							: undefined
					}
					emptyStateIcon={ImageIcon}
				/>
			),
		},
		showVideosTab && {
			id: 'videos',
			label: m['common.video.label'](),
			render: (isFocused: boolean) => (
				<ProfileFeedSection
					feed={`author|${profile.did}|posts_with_video`}
					isFocused={isFocused}
					ignoreFilterFor={profile.did}
					emptyStateMessage={m['common.video.empty']()}
					emptyStateButton={
						isMe
							? {
									label: m['common.compose.action.video'](),
									text: m['common.compose.action.video'](),
									onPress: () => openComposer({ logContext: 'ProfileFeed' }),
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
			render: (isFocused: boolean) => (
				<ProfileFeedSection
					feed={`likes|${profile.did}`}
					isFocused={isFocused}
					ignoreFilterFor={profile.did}
					emptyStateMessage={m['common.like.empty']()}
					emptyStateIcon={HeartIcon}
				/>
			),
		},
		showFeedsTab && {
			id: 'feeds',
			label: m['common.nav.feeds'](),
			render: (isFocused: boolean) => (
				<ProfileFeedgens did={profile.did} enabled={isFocused} feedCount={feedGenCount} />
			),
		},
		showStarterPacksTab && {
			id: 'starterPacks',
			label: m['common.starterPack.sectionTitle'](),
			render: (isFocused: boolean) => (
				<ProfileStarterPacks
					did={profile.did}
					isMe={isMe}
					enabled={isFocused}
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
		showListsTab &&
			!hasLabeler && {
				id: 'lists',
				label: m['common.list.label'](),
				render: (isFocused: boolean) => (
					<ProfileLists did={profile.did} enabled={isFocused} listCount={listCount} />
				),
			},
	]);

	// the selected tab, falling back to the first section until the user picks one (`showPostsTab` is
	// always true, so the list is never empty)
	// the profile is window-scrolled, so soft-reset just returns the page to the top
	useFocusEffect(useCallback(() => softReset.subscribe(() => window.scrollTo(0, 0)), []));

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
						labeler={labelerInfo}
						descriptionRT={hasDescription ? descriptionRT : null}
						moderationOpts={moderationOpts}
						hideBackButton={hideBackButton}
						isPlaceholderProfile={showPlaceholder}
						setMinimumHeight={noop}
					/>
				}
			/>
			{hasSession && (
				<FAB
					icon={<EditBigIcon size="xl" fill={colors.white} />}
					label={m['common.compose.action.new']()}
					onClick={onPressCompose}
				/>
			)}
		</ScreenHider>
	);
}

const noop = () => {};
