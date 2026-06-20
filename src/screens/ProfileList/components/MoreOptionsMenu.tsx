import type { AppBskyActorDefs, AppBskyGraphDefs } from '@atcute/bluesky';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';
import { Trans, useLingui } from '@lingui/react/macro';
import { useNavigation } from '@react-navigation/native';

import type { NavigationProp } from '#/lib/routes/types';
import { shareUrl } from '#/lib/sharing';
import { toShareUrl } from '#/lib/strings/url-helpers';

import { useListBlockMutation, useListDeleteMutation, useListMuteMutation } from '#/state/queries/list';
import { useRemoveFeedMutation } from '#/state/queries/preferences';
import { useSession } from '#/state/session';

import { logger } from '#/logger';

import { CreateOrEditListDialog } from '#/components/dialogs/lists/CreateOrEditListDialog';
import { ChainLink_Stroke2_Corner0_Rounded as ChainLink } from '#/components/icons/ChainLink';
import { DotGrid3x1_Stroke2_Corner0_Rounded as DotGridIcon } from '#/components/icons/DotGrid';
import { PencilLine_Stroke2_Corner0_Rounded as PencilLineIcon } from '#/components/icons/Pencil';
import { PersonCheck_Stroke2_Corner0_Rounded as PersonCheckIcon } from '#/components/icons/Person';
import { Pin_Stroke2_Corner0_Rounded as PinIcon } from '#/components/icons/Pin';
import { SpeakerVolumeFull_Stroke2_Corner0_Rounded as UnmuteIcon } from '#/components/icons/Speaker';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import { ReportDialog, useReportDialogControl } from '#/components/moderation/ReportDialog';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import * as Menu from '#/components/web/Menu';
import * as Prompt from '#/components/web/Prompt';

export function MoreOptionsMenu({
	list,
	savedFeedConfig,
}: {
	list: AppBskyGraphDefs.ListView;
	savedFeedConfig?: AppBskyActorDefs.SavedFeed;
}) {
	const { t: l } = useLingui();
	const { currentAccount } = useSession();
	const editListHandle = Dialog.useDialogHandle();
	const deleteListPromptHandle = Prompt.usePromptHandle();
	const reportDialogControl = useReportDialogControl();
	const navigation = useNavigation<NavigationProp>();

	const { mutateAsync: removeSavedFeed } = useRemoveFeedMutation();
	const { mutateAsync: deleteList } = useListDeleteMutation();
	const { mutateAsync: muteList } = useListMuteMutation();
	const { mutateAsync: blockList } = useListBlockMutation();

	const isCurateList = list.purpose === 'app.bsky.graph.defs#curatelist';
	const isModList = list.purpose === 'app.bsky.graph.defs#modlist';
	const isBlocking = !!list.viewer?.blocked;
	const isMuting = !!list.viewer?.muted;
	const isPinned = Boolean(savedFeedConfig?.pinned);
	const isOwner = currentAccount?.did === list.creator.did;

	const onPressShare = () => {
		const { rkey } = parseCanonicalResourceUri(list.uri);
		const url = toShareUrl(`/profile/${list.creator.did}/lists/${rkey}`);
		void shareUrl(url);
	};

	const onRemoveFromSavedFeeds = async () => {
		if (!savedFeedConfig) return;
		try {
			await removeSavedFeed(savedFeedConfig);
			Toast.show(l`Removed from your feeds`);
		} catch (e) {
			Toast.show(l`There was an issue contacting the server`, {
				type: 'error',
			});
			logger.error('Failed to remove pinned list', { message: e });
		}
	};

	const onPressDelete = async () => {
		await deleteList({ uri: list.uri });

		if (savedFeedConfig) {
			await removeSavedFeed(savedFeedConfig);
		}

		Toast.show(l({ message: 'List deleted', context: 'toast' }));
		if (navigation.canGoBack()) {
			navigation.goBack();
		} else {
			navigation.navigate('Home');
		}
	};

	const onUnpinModList = async () => {
		try {
			if (!savedFeedConfig) return;
			await removeSavedFeed(savedFeedConfig);
			Toast.show(l`Unpinned list`);
		} catch {
			Toast.show(l`Failed to unpin list`, {
				type: 'error',
			});
		}
	};

	const onUnsubscribeMute = async () => {
		try {
			await muteList({ uri: list.uri, mute: false });
			Toast.show(l({ message: 'List unmuted', context: 'toast' }));
		} catch {
			Toast.show(l`There was an issue. Please check your internet connection and try again.`);
		}
	};

	const onUnsubscribeBlock = async () => {
		try {
			await blockList({ uri: list.uri, block: false });
			Toast.show(l({ message: 'List unblocked', context: 'toast' }));
		} catch {
			Toast.show(l`There was an issue. Please check your internet connection and try again.`);
		}
	};

	return (
		<>
			<Menu.Root>
				<Menu.Trigger
					render={
						<Button label={l`More options`} size="small" color="secondary" shape="round">
							<ButtonIcon icon={DotGridIcon} />
						</Button>
					}
				/>
				<Menu.Popup label={l`More options`} align="end">
					<Menu.Group>
						<Menu.Item label={l`Copy link to list`} onClick={onPressShare}>
							<Menu.ItemText>{<Trans>Copy link to list</Trans>}</Menu.ItemText>
							<Menu.ItemIcon position="right" icon={ChainLink} />
						</Menu.Item>
						{savedFeedConfig && (
							<Menu.Item label={l`Remove from my feeds`} onClick={() => void onRemoveFromSavedFeeds()}>
								<Menu.ItemText>
									<Trans>Remove from my feeds</Trans>
								</Menu.ItemText>
								<Menu.ItemIcon position="right" icon={TrashIcon} />
							</Menu.Item>
						)}
					</Menu.Group>

					<Menu.Separator />

					{isOwner ? (
						<Menu.Group>
							<Menu.Item label={l`Edit list details`} onClick={() => editListHandle.open(null)}>
								<Menu.ItemText>
									<Trans>Edit list details</Trans>
								</Menu.ItemText>
								<Menu.ItemIcon position="right" icon={PencilLineIcon} />
							</Menu.Item>
							<Menu.Item label={l`Delete list`} onClick={() => deleteListPromptHandle.open(null)}>
								<Menu.ItemText>
									<Trans>Delete list</Trans>
								</Menu.ItemText>
								<Menu.ItemIcon position="right" icon={TrashIcon} />
							</Menu.Item>
						</Menu.Group>
					) : (
						<Menu.Group>
							<Menu.Item label={l`Report list`} onClick={() => reportDialogControl.open(null)}>
								<Menu.ItemText>
									<Trans>Report list</Trans>
								</Menu.ItemText>
								<Menu.ItemIcon position="right" icon={WarningIcon} />
							</Menu.Item>
						</Menu.Group>
					)}

					{isModList && isPinned && (
						<>
							<Menu.Separator />
							<Menu.Group>
								<Menu.Item label={l`Unpin moderation list`} onClick={() => void onUnpinModList()}>
									<Menu.ItemText>
										<Trans>Unpin moderation list</Trans>
									</Menu.ItemText>
									<Menu.ItemIcon icon={PinIcon} />
								</Menu.Item>
							</Menu.Group>
						</>
					)}

					{isCurateList && (isBlocking || isMuting) && (
						<>
							<Menu.Separator />
							<Menu.Group>
								{isBlocking && (
									<Menu.Item label={l`Unblock list`} onClick={() => void onUnsubscribeBlock()}>
										<Menu.ItemText>
											<Trans>Unblock list</Trans>
										</Menu.ItemText>
										<Menu.ItemIcon icon={PersonCheckIcon} />
									</Menu.Item>
								)}
								{isMuting && (
									<Menu.Item label={l`Unmute list`} onClick={() => void onUnsubscribeMute()}>
										<Menu.ItemText>
											<Trans>Unmute list</Trans>
										</Menu.ItemText>
										<Menu.ItemIcon icon={UnmuteIcon} />
									</Menu.Item>
								)}
							</Menu.Group>
						</>
					)}
				</Menu.Popup>
			</Menu.Root>
			<CreateOrEditListDialog handle={editListHandle} list={list} />
			<Prompt.Basic
				handle={deleteListPromptHandle}
				title={l`Delete this list?`}
				description={l`If you delete this list, you won't be able to recover it.`}
				onConfirm={() => void onPressDelete()}
				confirmButtonCta={l`Delete`}
				confirmButtonColor="negative"
			/>
			<ReportDialog
				control={reportDialogControl}
				subject={
					{
						...list,
						$type: 'app.bsky.graph.defs#listView',
					} as unknown as Parameters<typeof ReportDialog>[0]['subject']
				}
			/>
		</>
	);
}
