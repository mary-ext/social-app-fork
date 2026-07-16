import type { AppBskyGraphDefs } from '@atcute/bluesky';

import { useListBlockMutation, useListMuteMutation } from '#/state/queries/list';
import {
	useAddSavedFeedsMutation,
	type UsePreferencesQueryResponse,
	useUpdateSavedFeedsMutation,
} from '#/state/queries/preferences';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import { atoms as a } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { Pin_Stroke2_Corner0_Rounded as PinIcon } from '#/components/icons/Pin';
import { Spinner } from '#/components/Spinner';
import * as Toast from '#/components/Toast';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { useRouter } from '#/routes';

import { ListHeader } from './ListHeader';
import { MoreOptionsMenu } from './MoreOptionsMenu';
import { SubscribeMenu } from './SubscribeMenu';

export function Header({
	list,
	preferences,
}: {
	list: AppBskyGraphDefs.ListView;
	preferences: UsePreferencesQueryResponse;
}) {
	const router = useRouter();
	const { currentAccount } = useSession();
	const canGoBack = router.canGoBack;
	const isCurateList = list.purpose === 'app.bsky.graph.defs#curatelist';
	const isModList = list.purpose === 'app.bsky.graph.defs#modlist';
	const isBlocking = !!list.viewer?.blocked;
	const isMuting = !!list.viewer?.muted;

	const { mutateAsync: muteList, isPending: isMutePending } = useListMuteMutation();
	const { mutateAsync: blockList, isPending: isBlockPending } = useListBlockMutation();
	const { mutateAsync: addSavedFeeds, isPending: isAddSavedFeedPending } = useAddSavedFeedsMutation();
	const { mutateAsync: updateSavedFeeds, isPending: isUpdatingSavedFeeds } = useUpdateSavedFeedsMutation();

	const isPending = isAddSavedFeedPending || isUpdatingSavedFeeds;

	const savedFeedConfig = preferences?.savedFeeds?.find((f) => f.value === list.uri);
	const isPinned = Boolean(savedFeedConfig?.pinned);

	const onTogglePinned = async () => {
		try {
			if (savedFeedConfig) {
				const pinned = !savedFeedConfig.pinned;
				await updateSavedFeeds([
					{
						...savedFeedConfig,
						pinned,
					},
				]);
				Toast.show(
					pinned ? m['screens.profileList.pin.pinnedToast']() : m['screens.profileList.pin.unpinnedToast'](),
				);
			} else {
				await addSavedFeeds([
					{
						type: 'list',
						value: list.uri,
						pinned: true,
					},
				]);
				Toast.show(m['common.feeds.savedToast']());
			}
		} catch (e) {
			Toast.show(m['common.error.serverContact'](), {
				type: 'error',
			});
			logger.error('Failed to toggle pinned feed', { message: e });
		}
	};

	const onUnsubscribeMute = async () => {
		try {
			await muteList({ uri: list.uri, mute: false });
			Toast.show(m['screens.profileList.mute.unmutedToast']());
		} catch {
			Toast.show(m['common.error.issueConnection']());
		}
	};

	const onUnsubscribeBlock = async () => {
		try {
			await blockList({ uri: list.uri, block: false });
			Toast.show(m['screens.profileList.block.unblockedToast']());
		} catch {
			Toast.show(m['common.error.issueConnection']());
		}
	};

	return (
		<>
			<Layout.Header.Outer noBottomBorder sticky={false}>
				{canGoBack ? <Layout.Header.BackButton /> : <Layout.Header.MenuButton />}
				<Layout.Header.Content />
				<Layout.Header.Slot>
					{isCurateList ? (
						<Button
							testID={isPinned ? 'unpinBtn' : 'pinBtn'}
							color={isPinned ? 'secondary' : 'primary_subtle'}
							label={
								isPinned
									? m['screens.profileList.pin.action.unpin']()
									: m['screens.profileList.pin.action.pinToHome']()
							}
							onPress={() => void onTogglePinned()}
							disabled={isPending}
							size="small"
							style={[a.rounded_full]}
						>
							{!isPinned &&
								(isPending ? (
									<Spinner color="white" label={m['common.status.saving']()} size="sm" />
								) : (
									<ButtonIcon icon={PinIcon} />
								))}
							<ButtonText>
								{isPinned
									? m['screens.profileList.pin.action.unpin']()
									: m['screens.profileList.pin.action.pinToHome']()}
							</ButtonText>
						</Button>
					) : isModList ? (
						isBlocking ? (
							<Button
								testID="unblockBtn"
								color="secondary"
								label={m['common.block.action.unblock']()}
								onPress={() => void onUnsubscribeBlock()}
								size="small"
								style={[a.rounded_full]}
								disabled={isBlockPending}
							>
								{isBlockPending && <Spinner color="default" label={m['common.status.saving']()} size="sm" />}
								<ButtonText>{m['common.block.action.unblock']()}</ButtonText>
							</Button>
						) : isMuting ? (
							<Button
								testID="unmuteBtn"
								color="secondary"
								label={m['common.mute.action.unmute']()}
								onPress={() => void onUnsubscribeMute()}
								size="small"
								style={[a.rounded_full]}
								disabled={isMutePending}
							>
								{isMutePending && <Spinner color="default" label={m['common.status.saving']()} size="sm" />}
								<ButtonText>{m['common.mute.action.unmute']()}</ButtonText>
							</Button>
						) : (
							<SubscribeMenu list={list} />
						)
					) : null}
					<MoreOptionsMenu list={list} />
				</Layout.Header.Slot>
			</Layout.Header.Outer>
			<ListHeader list={list} isOwner={list.creator.did === currentAccount?.did} />
		</>
	);
}
