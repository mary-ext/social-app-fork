import type { AppBskyGraphDefs } from '@atcute/bluesky';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { useGoBack } from '#/lib/hooks/useGoBack';
import { shareUrl } from '#/lib/sharing';
import { toShareUrl } from '#/lib/strings/url-helpers';

import { useListBlockMutation, useListDeleteMutation, useListMuteMutation } from '#/state/queries/list';
import { useSession } from '#/state/session';

import * as Dialog from '#/components/Dialog';
import { CreateOrEditListDialog } from '#/components/dialogs/lists/CreateOrEditListDialog';
import { ChainLink_Stroke2_Corner0_Rounded as ChainLink } from '#/components/icons/ChainLink';
import { DotGrid3x1_Stroke2_Corner0_Rounded as DotGridIcon } from '#/components/icons/DotGrid';
import { PencilLine_Stroke2_Corner0_Rounded as PencilLineIcon } from '#/components/icons/Pencil';
import { PersonCheck_Stroke2_Corner0_Rounded as PersonCheckIcon } from '#/components/icons/Person';
import { SpeakerVolumeFull_Stroke2_Corner0_Rounded as UnmuteIcon } from '#/components/icons/Speaker';
import { Trash_Stroke2_Corner0_Rounded as TrashIcon } from '#/components/icons/Trash';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import * as Menu from '#/components/Menu';
import { ReportDialog } from '#/components/moderation/ReportDialog';
import * as Prompt from '#/components/Prompt';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

export function MoreOptionsMenu({ list }: { list: AppBskyGraphDefs.ListView }) {
	const { currentAccount } = useSession();
	const editListHandle = Dialog.useDialogHandle();
	const deleteListPromptHandle = Prompt.usePromptHandle();
	const reportDialogHandle = Dialog.useDialogHandle();
	const goBack = useGoBack();

	const { mutateAsync: deleteList } = useListDeleteMutation();
	const { mutateAsync: muteList } = useListMuteMutation();
	const { mutateAsync: blockList } = useListBlockMutation();

	const isCurateList = list.purpose === 'app.bsky.graph.defs#curatelist';
	const isBlocking = !!list.viewer?.blocked;
	const isMuting = !!list.viewer?.muted;
	const isOwner = currentAccount?.did === list.creator.did;

	const onPressShare = () => {
		const { rkey } = parseCanonicalResourceUri(list.uri);
		const url = toShareUrl(`/profile/${list.creator.did}/lists/${rkey}`);
		void shareUrl(url);
	};

	const onPressDelete = async () => {
		await deleteList({ uri: list.uri });

		Toast.show(m['screens.profileList.delete.deletedToast']());
		goBack();
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
			<Menu.Root>
				<Menu.Trigger
					render={
						<Button label={m['common.a11y.moreOptions']()} size="small" color="secondary" shape="round">
							<ButtonIcon icon={DotGridIcon} />
						</Button>
					}
				/>
				<Menu.Popup label={m['common.a11y.moreOptions']()} align="end">
					<Menu.Group>
						<Menu.Item label={m['screens.profileList.share.copyLink']()} onClick={onPressShare}>
							<Menu.ItemText>{m['screens.profileList.share.copyLink']()}</Menu.ItemText>
							<Menu.ItemIcon position="right" icon={ChainLink} />
						</Menu.Item>
					</Menu.Group>

					<Menu.Separator />

					{isOwner ? (
						<Menu.Group>
							<Menu.Item
								label={m['screens.profileList.edit.details']()}
								onClick={() => editListHandle.open(null)}
							>
								<Menu.ItemText>{m['screens.profileList.edit.details']()}</Menu.ItemText>
								<Menu.ItemIcon position="right" icon={PencilLineIcon} />
							</Menu.Item>
							<Menu.Item
								label={m['screens.profileList.delete.list']()}
								onClick={() => deleteListPromptHandle.open(null)}
							>
								<Menu.ItemText>{m['screens.profileList.delete.list']()}</Menu.ItemText>
								<Menu.ItemIcon position="right" icon={TrashIcon} />
							</Menu.Item>
						</Menu.Group>
					) : (
						<Menu.Group>
							<Menu.Item
								label={m['screens.profileList.report.list']()}
								onClick={() => reportDialogHandle.open(null)}
							>
								<Menu.ItemText>{m['screens.profileList.report.list']()}</Menu.ItemText>
								<Menu.ItemIcon position="right" icon={WarningIcon} />
							</Menu.Item>
						</Menu.Group>
					)}

					{isCurateList && (isBlocking || isMuting) && (
						<>
							<Menu.Separator />
							<Menu.Group>
								{isBlocking && (
									<Menu.Item
										label={m['screens.profileList.block.action.unblock']()}
										onClick={() => void onUnsubscribeBlock()}
									>
										<Menu.ItemText>{m['screens.profileList.block.action.unblock']()}</Menu.ItemText>
										<Menu.ItemIcon icon={PersonCheckIcon} />
									</Menu.Item>
								)}
								{isMuting && (
									<Menu.Item
										label={m['screens.profileList.mute.action.unmute']()}
										onClick={() => void onUnsubscribeMute()}
									>
										<Menu.ItemText>{m['screens.profileList.mute.action.unmute']()}</Menu.ItemText>
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
				title={m['screens.profileList.delete.confirm.title']()}
				description={m['screens.profileList.delete.confirm.message']()}
				onConfirm={() => void onPressDelete()}
				confirmButtonCta={m['common.action.delete']()}
				confirmButtonColor="negative"
			/>
			<ReportDialog
				handle={reportDialogHandle}
				subject={{
					...list,
					$type: 'app.bsky.graph.defs#listView',
				}}
			/>
		</>
	);
}
