import { useMemo } from 'react';
import { View } from 'react-native';
import type { AppBskyGraphDefs } from '@atcute/bluesky';

import { makeListLink } from '#/lib/routes/links';

import { useListBlockMutation, useListMuteMutation } from '#/state/queries/list';
import {
	useAddSavedFeedsMutation,
	type UsePreferencesQueryResponse,
	useUpdateSavedFeedsMutation,
} from '#/state/queries/preferences';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import { ProfileSubpageHeader } from '#/view/com/profile/ProfileSubpageHeader';

import { atoms as a } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { Pin_Stroke2_Corner0_Rounded as PinIcon } from '#/components/icons/Pin';
import { Loader } from '#/components/Loader';
import { RichText } from '#/components/RichText';
import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

import { MoreOptionsMenu } from './MoreOptionsMenu';
import { SubscribeMenu } from './SubscribeMenu';

export function Header({
	rkey,
	list,
	preferences,
}: {
	rkey: string;
	list: AppBskyGraphDefs.ListView;
	preferences: UsePreferencesQueryResponse;
}) {
	const { currentAccount } = useSession();
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
					pinned ? m['screens.profileList.toast.pinned']() : m['screens.profileList.toast.unpinned'](),
				);
			} else {
				await addSavedFeeds([
					{
						type: 'list',
						value: list.uri,
						pinned: true,
					},
				]);
				Toast.show(m['common.label.savedToFeeds']());
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
			Toast.show(m['screens.profileList.toast.unmuted']());
		} catch {
			Toast.show(m['common.error.issueConnection']());
		}
	};

	const onUnsubscribeBlock = async () => {
		try {
			await blockList({ uri: list.uri, block: false });
			Toast.show(m['screens.profileList.toast.unblocked']());
		} catch {
			Toast.show(m['common.error.issueConnection']());
		}
	};

	const descriptionRT = useMemo(
		() =>
			list.description
				? {
						text: list.description,
						facets: list.descriptionFacets ?? [],
					}
				: undefined,
		[list],
	);

	return (
		<>
			<ProfileSubpageHeader
				href={makeListLink(list.creator.did, rkey)}
				title={list.name}
				avatar={list.avatar}
				isOwner={list.creator.did === currentAccount?.did}
				creator={list.creator}
				purpose={list.purpose}
				avatarType="list"
			>
				{isCurateList ? (
					<Button
						testID={isPinned ? 'unpinBtn' : 'pinBtn'}
						color={isPinned ? 'secondary' : 'primary_subtle'}
						label={
							isPinned ? m['screens.profileList.action.unpin']() : m['screens.profileList.action.pinToHome']()
						}
						onPress={() => void onTogglePinned()}
						disabled={isPending}
						size="small"
						style={[a.rounded_full]}
					>
						{!isPinned && <ButtonIcon icon={isPending ? Loader : PinIcon} />}
						<ButtonText>
							{isPinned
								? m['screens.profileList.action.unpin']()
								: m['screens.profileList.action.pinToHome']()}
						</ButtonText>
					</Button>
				) : isModList ? (
					isBlocking ? (
						<Button
							testID="unblockBtn"
							color="secondary"
							label={m['common.action.unblock']()}
							onPress={() => void onUnsubscribeBlock()}
							size="small"
							style={[a.rounded_full]}
							disabled={isBlockPending}
						>
							{isBlockPending && <ButtonIcon icon={Loader} />}
							<ButtonText>{m['common.action.unblock']()}</ButtonText>
						</Button>
					) : isMuting ? (
						<Button
							testID="unmuteBtn"
							color="secondary"
							label={m['common.action.unmute']()}
							onPress={() => void onUnsubscribeMute()}
							size="small"
							style={[a.rounded_full]}
							disabled={isMutePending}
						>
							{isMutePending && <ButtonIcon icon={Loader} />}
							<ButtonText>{m['common.action.unmute']()}</ButtonText>
						</Button>
					) : (
						<SubscribeMenu list={list} />
					)
				) : null}
				<MoreOptionsMenu list={list} />
			</ProfileSubpageHeader>
			{descriptionRT ? (
				<View style={[a.px_lg, a.pt_sm, a.pb_sm, a.gap_md]}>
					<RichText size="md" value={descriptionRT} />
				</View>
			) : null}
		</>
	);
}
