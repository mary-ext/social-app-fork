import { useCallback, useEffect, useMemo, useState } from 'react';
import type { AppBskyActorDefs } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';
import { useLingui } from '@lingui/react/macro';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';

import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import { useSetTitle } from '#/lib/hooks/useSetTitle';
import type { CommonNavigatorParams, NativeStackScreenProps, NavigationProp } from '#/lib/routes/types';
import { combinedDisplayName } from '#/lib/strings/display-names';
import { cleanError } from '#/lib/strings/errors';
import { isInvalidHandle } from '#/lib/strings/handles';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { listenSoftReset } from '#/state/events';
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

import { ProfileHeader, ProfileHeaderLoading } from '#/screens/Profile/Header';
import { ProfileFeedSection } from '#/screens/Profile/Sections/Feed';
import { ProfileLabelsSection } from '#/screens/Profile/Sections/Labels';

import { atoms as a, useTheme } from '#/alf';

import { useRichText } from '#/components/hooks/useRichText';
import { Circle_And_Square_Stroke1_Corner0_Rounded_Filled as CircleAndSquareIcon } from '#/components/icons/CircleAndSquare';
import { EditBig_Stroke2_Corner2_Rounded as EditBigIcon } from '#/components/icons/EditBig';
import { Heart2_Stroke1_Corner0_Rounded as HeartIcon } from '#/components/icons/Heart2';
import { Image_Stroke1_Corner0_Rounded as ImageIcon } from '#/components/icons/Image';
import { Message_Stroke1_Corner0_Rounded_Filled as MessageIcon } from '#/components/icons/Message';
import { VideoClip_Stroke1_Corner0_Rounded as VideoIcon } from '#/components/icons/VideoClip';
import * as Layout from '#/components/Layout';
import { ScreenHider } from '#/components/moderation/ScreenHider';
import { ProfileStarterPacks } from '#/components/StarterPack/ProfileStarterPacks';
import * as Tabs from '#/components/web/Tabs';

import { navigate } from '#/Navigation';

import * as css from './Profile.css';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'Profile'>;
export function ProfileScreen(props: Props) {
	return (
		<Layout.Screen testID="profileScreen" style={[a.pt_0]}>
			<ProfileScreenInner {...props} />
		</Layout.Screen>
	);
}

function ProfileScreenInner({ route }: Props) {
	const { t: l } = useLingui();
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
				<ProfileHeaderLoading />
			</Layout.Content>
		);
	}
	if (resolveError || profileError) {
		return (
			<ErrorScreen
				title={profileError ? l`Not Found` : l`Oops!`}
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
	const t = useTheme();
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
	const { t: l } = useLingui();

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
	const sections = [
		showFiltersTab && {
			id: 'labels',
			title: l`Labels`,
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
				title: l`Lists`,
				render: (isFocused: boolean) => <ProfileLists did={profile.did} enabled={isFocused} />,
			},
		showPostsTab && {
			id: 'posts',
			title: l`Posts`,
			render: (isFocused: boolean) => (
				<ProfileFeedSection
					feed={`author|${profile.did}|posts_and_author_threads`}
					isFocused={isFocused}
					ignoreFilterFor={profile.did}
					emptyStateMessage={l`No posts yet`}
					emptyStateButton={
						isMe
							? {
									label: l`Write a post`,
									text: l`Write a post`,
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
			title: l`Replies`,
			render: (isFocused: boolean) => (
				<ProfileFeedSection
					feed={`author|${profile.did}|posts_with_replies`}
					isFocused={isFocused}
					ignoreFilterFor={profile.did}
					emptyStateMessage={l`No replies yet`}
					emptyStateIcon={MessageIcon}
				/>
			),
		},
		showMediaTab && {
			id: 'media',
			title: l`Media`,
			render: (isFocused: boolean) => (
				<ProfileFeedSection
					feed={`author|${profile.did}|posts_with_media`}
					isFocused={isFocused}
					ignoreFilterFor={profile.did}
					emptyStateMessage={l`No media yet`}
					emptyStateButton={
						isMe
							? {
									label: l`Post a photo`,
									text: l`Post a photo`,
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
			title: l`Videos`,
			render: (isFocused: boolean) => (
				<ProfileFeedSection
					feed={`author|${profile.did}|posts_with_video`}
					isFocused={isFocused}
					ignoreFilterFor={profile.did}
					emptyStateMessage={l`No video posts yet`}
					emptyStateButton={
						isMe
							? {
									label: l`Post a video`,
									text: l`Post a video`,
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
			title: l`Likes`,
			render: (isFocused: boolean) => (
				<ProfileFeedSection
					feed={`likes|${profile.did}`}
					isFocused={isFocused}
					ignoreFilterFor={profile.did}
					emptyStateMessage={l`No likes yet`}
					emptyStateIcon={HeartIcon}
				/>
			),
		},
		showFeedsTab && {
			id: 'feeds',
			title: l`Feeds`,
			render: (isFocused: boolean) => <ProfileFeedgens did={profile.did} enabled={isFocused} />,
		},
		showStarterPacksTab && {
			id: 'starterPacks',
			title: l`Starter Packs`,
			render: (isFocused: boolean) => (
				<ProfileStarterPacks
					did={profile.did}
					isMe={isMe}
					enabled={isFocused}
					emptyStateMessage={
						isMe
							? l`Starter Packs let you share your favorite feeds and people with your friends.`
							: l`No Starter Packs yet`
					}
					emptyStateButton={
						isMe
							? {
									label: l`Create a Starter Pack`,
									text: l`Create a Starter Pack`,
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
				title: l`Lists`,
				render: (isFocused: boolean) => <ProfileLists did={profile.did} enabled={isFocused} />,
			},
	].filter(Boolean) as ProfileSection[];

	// the selected tab, falling back to the first section until the user picks one (`showPostsTab` is
	// always true, so the list is never empty)
	const activeTab = selectedTab ?? sections[0]?.id ?? '';

	// the profile is window-scrolled, so soft-reset just returns the page to the top
	useFocusEffect(useCallback(() => listenSoftReset(() => window.scrollTo(0, 0)), []));

	return (
		<ScreenHider
			className={css.container}
			screenDescription={l`user`}
			modui={getDisplayRestrictions(moderation, DisplayContext.ProfileView)}
		>
			<Tabs.Root value={activeTab} onValueChange={setSelectedTab}>
				<ProfileHeader
					profile={profile}
					labeler={labelerInfo}
					descriptionRT={hasDescription ? descriptionRT : null}
					moderationOpts={moderationOpts}
					hideBackButton={hideBackButton}
					isPlaceholderProfile={showPlaceholder}
					setMinimumHeight={noop}
				/>
				{isHeaderReady && (
					<Tabs.List>
						{sections.map((section) => (
							<Tabs.Tab
								key={section.id}
								label={section.title}
								value={section.id}
								onClick={() => {
									if (activeTab === section.id) {
										window.scrollTo(0, 0);
									}
								}}
							/>
						))}
					</Tabs.List>
				)}
				{sections.map((section) => (
					<Tabs.Panel key={section.id} value={section.id}>
						{isHeaderReady && section.render(activeTab === section.id)}
					</Tabs.Panel>
				))}
			</Tabs.Root>
			{hasSession && (
				<FAB
					icon={<EditBigIcon size="lg" fill={t.palette.white} />}
					label={l`New post`}
					onClick={onPressCompose}
				/>
			)}
		</ScreenHider>
	);
}

const noop = () => {};

interface ProfileSection {
	id: string;
	render: (isFocused: boolean) => React.ReactNode;
	title: string;
}
