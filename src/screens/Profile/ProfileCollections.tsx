import type { ReactNode } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';
import type { Did } from '@atcute/lexicons';
import type { ActorIdentifier } from '@atcute/lexicons/syntax';

import { cleanError } from '#/lib/errors';

import { useProfileQuery } from '#/state/queries/profile';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';
import { useSession } from '#/state/session';
import { useTitle } from '#/state/use-title';

import { ProfileFeedgens } from '#/screens/Profile/components/ProfileFeedgens';
import { ProfileLists } from '#/screens/Profile/components/ProfileLists';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import { ErrorScreen } from '#/components/ErrorScreen';
import { ProfileStarterPacks } from '#/components/StarterPack/ProfileStarterPacks';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { useParams } from '#/router';

// #region screens

/** @returns a profile's feeds screen */
export function ProfileFeedsScreen() {
	const [{ actor }] = useParams('ProfileFeeds');
	const owner = useCollectionOwner(actor);

	useTitle(
		owner.profile
			? m['screens.profile.collections.feeds.title']({ handle: owner.profile.handle })
			: m['common.nav.feeds'](),
	);

	return (
		<CollectionScreen owner={owner} title={m['common.nav.feeds']()}>
			{(did, profile) => <ProfileFeedgens did={did} feedCount={profile.associated?.feedgens} />}
		</CollectionScreen>
	);
}

/** @returns a profile's starter packs screen */
export function ProfileStarterPacksScreen() {
	const [{ actor }] = useParams('ProfileStarterPacks');
	const owner = useCollectionOwner(actor);

	useTitle(
		owner.profile
			? m['screens.profile.collections.starterPacks.title']({ handle: owner.profile.handle })
			: m['common.starterPack.sectionTitle'](),
	);

	return (
		<CollectionScreen owner={owner} title={m['common.starterPack.sectionTitle']()}>
			{(did, profile) => (
				<ProfileStarterPacks
					did={did}
					isMe={owner.isMe}
					starterPackCount={profile.associated?.starterPacks}
				/>
			)}
		</CollectionScreen>
	);
}

/** @returns a profile's lists screen */
export function ProfileListsScreen() {
	const [{ actor }] = useParams('ProfileLists');
	const owner = useCollectionOwner(actor);

	useTitle(
		owner.profile
			? m['screens.profile.collections.lists.title']({ handle: owner.profile.handle })
			: m['common.list.label'](),
	);

	return (
		<CollectionScreen owner={owner} title={m['common.list.label']()}>
			{(did, profile) => {
				const listCount = Math.max(
					0,
					(profile.associated?.lists || 0) - (profile.associated?.starterPacks || 0),
				);

				return <ProfileLists did={did} listCount={listCount} />;
			}}
		</CollectionScreen>
	);
}

// #endregion

// #region shared scaffolding

type CollectionOwner = {
	did: Did | undefined;
	error: unknown;
	isMe: boolean;
	isPending: boolean;
	profile: AppBskyActorDefs.ProfileViewDetailed | undefined;
	retry: () => void;
};

function useCollectionOwner(actor: ActorIdentifier): CollectionOwner {
	const { currentAccount } = useSession();
	const {
		data: did,
		error: resolveError,
		isPending: isResolvingDid,
		refetch: refetchDid,
	} = useResolveDidQuery(actor);
	const {
		data: profile,
		error: profileError,
		isPending: isProfilePending,
		refetch: refetchProfile,
	} = useProfileQuery({ did });

	// the profile query remains pending when DID resolution fails
	const error = resolveError ?? profileError;

	return {
		did,
		error,
		isMe: !!did && did === currentAccount?.did,
		isPending: !error && (isResolvingDid || isProfilePending),
		profile,
		retry: () => {
			if (resolveError) {
				void refetchDid();
			} else {
				void refetchProfile();
			}
		},
	};
}

function CollectionScreen({
	children,
	owner,
	title,
}: {
	children: (did: Did, profile: AppBskyActorDefs.ProfileViewDetailed) => ReactNode;
	owner: CollectionOwner;
	title: string;
}) {
	const { did, error, isPending, profile } = owner;

	let body: ReactNode;
	if (did && profile) {
		body = children(did, profile);
	} else if (isPending) {
		body = <CenteredSpinner label={m['common.status.loading']()} size="_2xl" />;
	} else {
		body = (
			<ErrorScreen
				title={m['common.error.oops']()}
				message={cleanError(error) || m['common.error.generic']()}
				onPressTryAgain={owner.retry}
			/>
		);
	}

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					<Layout.Header.TitleText>{title}</Layout.Header.TitleText>
					{profile && <Layout.Header.SubtitleText>{`@${profile.handle}`}</Layout.Header.SubtitleText>}
				</Layout.Header.Content>
			</Layout.Header.Outer>
			{body}
		</Layout.Screen>
	);
}

// #endregion
