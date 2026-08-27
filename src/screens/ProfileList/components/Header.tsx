import type { Ref } from 'react';

import type { AppBskyGraphDefs } from '@atcute/bluesky';

import { useListBlockMutation, useListMuteMutation } from '#/state/queries/list';
import {
	useAddSavedFeedsMutation,
	type UsePreferencesQueryResponse,
	useUpdateSavedFeedsMutation,
} from '#/state/queries/preferences';
import { useSession } from '#/state/session';

import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';

import PinIcon from '#/icons/central/Thumbtack_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useRouter } from '#/router';

import { ListByline, ListHeader } from './ListHeader';
import { MoreOptionsMenu } from './MoreOptionsMenu';
import { SubscribeMenu } from './SubscribeMenu';

export function Header({
	bottomBorder,
	list,
	preferences,
	ref,
}: {
	bottomBorder?: boolean;
	list: AppBskyGraphDefs.ListView;
	preferences: UsePreferencesQueryResponse;
	ref?: Ref<HTMLDivElement>;
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
	const isPinned = !!savedFeedConfig?.pinned;
	const isOwner = list.creator.did === currentAccount?.did;

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
			console.error('Failed to toggle pinned feed', e);
			Toast.show(m['common.error.serverContact'](), {
				type: 'error',
			});
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
			<Layout.Header.Outer noBottomBorder ref={ref}>
				{canGoBack ? <Layout.Header.BackButton /> : <Layout.Header.MenuButton />}
				<Layout.Header.Content className={Layout.ScrollAway.reveal}>
					<Text numberOfLines={1} size="lg" weight="semiBold">
						{list.name || ''}
					</Text>
					<Text color="textContrastMedium" numberOfLines={1} size="sm">
						<ListByline isOwner={isOwner} list={list} />
					</Text>
				</Layout.Header.Content>
				<Layout.Header.Slot>
					{isCurateList ? (
						<Button
							color={isPinned ? 'secondary' : 'primary_subtle'}
							label={
								isPinned
									? m['screens.profileList.pin.action.unpin']()
									: m['screens.profileList.pin.action.pinToHome']()
							}
							onClick={() => void onTogglePinned()}
							disabled={isPending}
							size="small"
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
								color="secondary"
								label={m['common.block.action.unblock']()}
								onClick={() => void onUnsubscribeBlock()}
								size="small"
								disabled={isBlockPending}
							>
								{isBlockPending && <Spinner color="default" label={m['common.status.saving']()} size="sm" />}
								<ButtonText>{m['common.block.action.unblock']()}</ButtonText>
							</Button>
						) : isMuting ? (
							<Button
								color="secondary"
								label={m['common.mute.action.unmute']()}
								onClick={() => void onUnsubscribeMute()}
								size="small"
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
				<Layout.ScrollAway.Backdrop />
			</Layout.Header.Outer>
			<Layout.ScrollAway.Region>
				<ListHeader list={list} isOwner={isOwner} bottomBorder={bottomBorder} />
			</Layout.ScrollAway.Region>
		</>
	);
}
