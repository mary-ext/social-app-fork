import type { AppBskyActorDefs as ActorDefs } from '@atcute/bluesky';
import type { Did } from '@atcute/lexicons';

import { cleanError } from '#/lib/errors';

import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { useProfileQuery } from '#/state/queries/profile';
import { useProfileFollowsQuery } from '#/state/queries/profile-follows';
import { useResolveDidQuery } from '#/state/queries/resolve-uri';
import { useSession } from '#/state/session';
import { useTitle } from '#/state/use-title';

import { BlankState } from '#/components/BlankState';
import * as Dialog from '#/components/Dialog';
import { ErrorState } from '#/components/ErrorState';
import { FollowCleanupDialog } from '#/components/FollowCleanupDialog';
import { List } from '#/components/List/List';
import * as ListTail from '#/components/List/ListTail';
import * as Menu from '#/components/Menu';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';
import { LinkButton } from '#/components/web/Link';
import * as ProfileCard from '#/components/web/ProfileCard';

import DotGridIcon from '#/icons/central/DotGrid1x3Horizontal_round_outlined_radius1_stroke2.svg';
import PeopleRemoveRoundIcon from '#/icons/central/PeopleRemove_round_outlined_radius1_stroke2.svg';
import PeopleRemoveIcon from '#/icons/central/PeopleRemove_round_outlined_radius3_stroke1.svg';
import { m } from '#/paraglide/messages';
import { useParams } from '#/router';

export const ProfileFollowsScreen = () => {
	const [{ actor }] = useParams('ProfileFollows');
	const { currentAccount } = useSession();
	const { data: resolvedDid, error: resolveError, refetch: refetchResolve } = useResolveDidQuery(actor);
	const { data: profile } = useProfileQuery({
		did: resolvedDid,
	});

	const followsCount = profile?.followsCount;
	const isMe = !!resolvedDid && resolvedDid === currentAccount?.did;

	useTitle(
		profile
			? m['screens.profile.follow.following.title']({ handle: profile.handle })
			: m['common.follow.action.following'](),
	);

	return (
		<Layout.Screen>
			<Layout.Header.Outer>
				<Layout.Header.BackButton />
				<Layout.Header.Content>
					{profile && (
						<>
							<Layout.Header.TitleText>{profile.handle}</Layout.Header.TitleText>
							<Layout.Header.SubtitleText>
								{m['screens.profile.follow.following.count']({ count: followsCount ?? 0 })}
							</Layout.Header.SubtitleText>
						</>
					)}
				</Layout.Header.Content>
				{isMe && (
					<Layout.Header.EndSlot>
						<OverflowMenu />
					</Layout.Header.EndSlot>
				)}
			</Layout.Header.Outer>
			{resolveError ? (
				<ErrorState onRetry={() => void refetchResolve()} />
			) : (
				<ProfileFollows initialCount={followsCount} isMe={isMe} resolvedDid={resolvedDid} />
			)}
		</Layout.Screen>
	);
};

function OverflowMenu() {
	const cleanupHandle = Dialog.useDialogHandle();

	return (
		<>
			<Menu.Root>
				<Menu.Trigger
					render={
						<Button
							label={m['common.a11y.moreOptions']()}
							color="secondary"
							shape="round"
							size="small"
							variant="ghost"
						>
							<ButtonIcon icon={DotGridIcon} size="lg" />
						</Button>
					}
				/>
				<Menu.Popup align="end" label={m['common.a11y.moreOptions']()}>
					<Menu.Group>
						<Menu.Item
							label={m['components.followCleanupDialog.title']()}
							onClick={() => cleanupHandle.open(null)}
						>
							<Menu.ItemText>{m['components.followCleanupDialog.title']()}</Menu.ItemText>
							<Menu.ItemIcon icon={PeopleRemoveRoundIcon} position="right" />
						</Menu.Item>
					</Menu.Group>
				</Menu.Popup>
			</Menu.Root>
			<FollowCleanupDialog handle={cleanupHandle} />
		</>
	);
}

const PROFILE_ITEM_HEIGHT_ESTIMATE = 130;

function keyExtractor(item: ActorDefs.ProfileView) {
	return item.did;
}

function ProfileFollows({
	initialCount,
	isMe,
	resolvedDid,
}: {
	initialCount?: number;
	isMe: boolean;
	resolvedDid: Did | undefined;
}) {
	const moderationOpts = useModerationOpts();

	const sort = isMe ? 'latest' : 'top';
	const { data, isPending, isFetchingNextPage, fetchNextPage, error, refetch } = useProfileFollowsQuery(
		resolvedDid,
		{ sort },
	);

	const isError = !!error;

	const follows = data?.pages ? data.pages.flatMap((page) => page.follows) : [];

	if (isError && follows.length < 1) {
		return <ErrorState onRetry={() => void refetch()} />;
	}

	// the paged query stays pending while the did resolves, so this covers both fetches
	if (isPending || !moderationOpts) {
		return <ProfileCard.LoadingPlaceholder count={initialCount} />;
	}

	if (follows.length < 1) {
		return (
			<BlankState
				actions={
					<LinkButton
						color="primary"
						label={m['view.profile.action.seeSuggested']()}
						size="small"
						to={{ name: 'Explore' }}
						variant="solid"
					>
						<ButtonText>{m['view.profile.action.seeSuggested']()}</ButtonText>
					</LinkButton>
				}
				icon={PeopleRemoveIcon}
				message={
					isMe
						? m['view.profile.followers.followingEmpty']()
						: m['view.profile.followers.followingEmptyUser']()
				}
			/>
		);
	}

	return (
		<List
			data={follows}
			estimateHeight={PROFILE_ITEM_HEIGHT_ESTIMATE}
			keyExtractor={keyExtractor}
			ListFooterComponent={
				<ListTail.Frame>
					{isFetchingNextPage ? (
						<ListTail.Pending />
					) : isError ? (
						<ListTail.Error message={cleanError(error)} onRetry={() => void fetchNextPage()} />
					) : null}
				</ListTail.Frame>
			}
			renderItem={({ index, item }) => (
				<ProfileCard.Default moderationOpts={moderationOpts} profile={item} topBorder={index !== 0} />
			)}
			onEndReached={() => {
				if (isError) {
					return;
				}
				void fetchNextPage();
			}}
			onEndReachedThreshold={2}
		/>
	);
}
