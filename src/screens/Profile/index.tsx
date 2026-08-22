import { useEffect } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateProfile,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';

import { definite } from '@mary/array-fns';

import { useQueryClient } from '@tanstack/react-query';

import { combinedDisplayName, isInvalidHandle } from '#/lib/display-names';
import { cleanError } from '#/lib/errors';
import { profileTarget } from '#/lib/routes/targets';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { softReset } from '#/state/events';
import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { resetProfilePostsQueries } from '#/state/queries/post-feed';
import { useProfileQuery } from '#/state/queries/profile';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';
import { useSession } from '#/state/session';
import { useTitle } from '#/state/use-title';

import { useOpenComposer } from '#/features/composer/open-composer';

import { ProfileHeader } from '#/screens/Profile/Header';
import { ProfileHeaderSkeleton } from '#/screens/Profile/Header/Skeleton';
import { ProfileCollectionsSection } from '#/screens/Profile/Sections/Collections';
import { ProfileMediaFilter, ProfileMediaSection } from '#/screens/Profile/Sections/Media';
import { ProfilePostsFilter, ProfilePostsSection } from '#/screens/Profile/Sections/Posts';

import { ErrorScreen } from '#/components/ErrorScreen';
import { FAB } from '#/components/FAB';
import { ScreenHider } from '#/components/moderation/ScreenHider';
import { type Section, Tabs } from '#/components/Tabs';
import * as Layout from '#/components/web/Layout';

import EditBigIcon from '#/icons/central/EditBig_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useFocusEffect, useParams, useRouter } from '#/router';

import * as css from './index.css';

type ProfileTabId = 'collections' | 'media' | 'posts';

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

	// a disabled profile query remains pending until handle resolution produces a DID.
	if (isDidPending || (!!resolvedDid && isProfilePending)) {
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
	const { hasSession, currentAccount } = useSession();

	const profile = useProfileShadow(profileUnshadowed);
	const { openComposer } = useOpenComposer();

	const [{ tab }, replaceParams] = useParams('Profile');

	useTitle(combinedDisplayName(profile));

	const moderation = moderateProfile(profile, moderationOpts);

	const isMe = profile.did === currentAccount?.did;

	const feedCount = profile.associated?.feedgens || 0;
	const starterPackCount = profile.associated?.starterPacks || 0;
	const listCount = Math.max(0, (profile.associated?.lists || 0) - starterPackCount);
	const showCollectionsTab = isMe || feedCount > 0 || starterPackCount > 0 || listCount > 0;

	const onPressCompose = () => {
		const mention =
			profile.handle === currentAccount?.handle || isInvalidHandle(profile.handle)
				? undefined
				: profile.handle;
		openComposer({ mention });
	};

	const sections = definite<Section<ProfileTabId>>([
		{
			id: 'posts',
			label: m['common.post.label'](),
			actions: <ProfilePostsFilter />,
			children: <ProfilePostsSection did={profile.did} isMe={isMe} />,
		},
		{
			id: 'media',
			label: m['common.media.label'](),
			actions: <ProfileMediaFilter />,
			children: <ProfileMediaSection did={profile.did} isMe={isMe} />,
		},
		showCollectionsTab && {
			id: 'collections',
			label: m['screens.profile.collections.label'](),
			children: (
				<ProfileCollectionsSection
					did={profile.did}
					feedCount={feedCount}
					isMe={isMe}
					listCount={listCount}
					starterPackCount={starterPackCount}
				/>
			),
		},
	]);

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
				sections={isPlaceholderProfile ? [] : sections}
				value={tab ?? 'posts'}
				onValueChange={(next) => replaceParams({ tab: next })}
				variant="hug"
				header={
					<ProfileHeader
						profile={profile}
						moderationOpts={moderationOpts}
						isPlaceholderProfile={isPlaceholderProfile}
					/>
				}
			/>
			{hasSession && (
				<FAB icon={EditBigIcon} label={m['common.compose.action.new']()} onClick={onPressCompose} />
			)}
		</ScreenHider>
	);
}
