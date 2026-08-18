import type { AnyProfileView } from '@atcute/bluesky';
import type { BlockingModerationCause } from '@atcute/bluesky-moderation';

import { useQueryClient } from '@tanstack/react-query';

import { profileTarget } from '#/lib/routes/targets';

import type { Shadow } from '#/state/cache/types';
import { useConvoQuery, useMarkAsReadMutation } from '#/state/queries/messages/conversation';
import { useMuteConvo } from '#/state/queries/messages/mute-conversation';
import { unstableCacheProfileView, useProfileBlockMutationQueue } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import * as Dialog from '#/components/Dialog';
import { AfterReportConversationDialog } from '#/components/dms/AfterReportConversationDialog';
import { AfterReportDialog } from '#/components/dms/AfterReportDialog';
import { BlockedByListDialog } from '#/components/dms/BlockedByListDialog';
import { LeaveConvoPrompt } from '#/components/dms/LeaveConvoPrompt';
import { ReportConversationDialog } from '#/components/dms/ReportConversationDialog';
import { getConvoReportSubject, type ConvoWithDetails } from '#/components/dms/util';
import * as Menu from '#/components/Menu';
import { ReportDialog } from '#/components/moderation/ReportDialog';
import * as Prompt from '#/components/Prompt';
import * as Toast from '#/components/Toast';

import ArrowBoxLeftIcon from '#/icons/central/ArrowBoxLeft_round_outlined_radius1_stroke2.svg';
import BubbleIcon from '#/icons/central/Bubble2_round_outlined_radius1_stroke2.svg';
import Flag from '#/icons/central/Flag1_round_outlined_radius1_stroke2.svg';
import Mute from '#/icons/central/Mute_round_outlined_radius1_stroke2.svg';
import Person from '#/icons/central/People_round_outlined_radius1_stroke2.svg';
import PersonCheck from '#/icons/central/PeopleAdded_round_outlined_radius1_stroke2.svg';
import PersonX from '#/icons/central/PeopleRemove_round_outlined_radius1_stroke2.svg';
import Unmute from '#/icons/central/VolumeFull_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useRouter } from '#/router';

export type BlockInfo = {
	listBlocks: BlockingModerationCause[];
	userBlock?: BlockingModerationCause;
};

/**
 * The conversation menu's popup and the dialogs its items open. Mounted by {@link ConvoMenu} once the menu has
 * been opened for the first time, so the rows in a long chat list don't each run this hook stack.
 */
export function ConvoMenuItems({
	convo,
	profile,
	currentScreen,
	showMarkAsRead,
	blockInfo,
}: {
	convo: ConvoWithDetails;
	profile: Shadow<AnyProfileView>;
	currentScreen: 'list' | 'conversation';
	showMarkAsRead?: boolean;
	blockInfo: BlockInfo;
}) {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { currentAccount } = useSession();

	const leaveConvoPromptHandle = Prompt.usePromptHandle();
	const blockedByListPromptHandle = Prompt.usePromptHandle();
	const reportHandle = Dialog.useDialogHandle();
	const blockOrDeleteHandle = Dialog.useDialogHandle();
	const deleteHandle = Dialog.useDialogHandle();

	const convoId = convo.view.id;
	const { data: liveConvo } = useConvoQuery({ convoId });
	const { mutate: markAsRead } = useMarkAsReadMutation();
	const { mutate: muteConvo } = useMuteConvo(convoId, {
		onSuccess: (data) => {
			if (data.convo.muted) {
				Toast.show(m['components.dms.mute.mutedToast']());
			} else {
				Toast.show(m['components.dms.mute.unmutedToast']());
			}
		},
		onError: () => {
			Toast.show(m['components.dms.mute.error.mute'](), {
				type: 'error',
			});
		},
	});
	const [queueBlock, queueUnblock] = useProfileBlockMutationQueue(profile);

	const reportSubject = getConvoReportSubject(convo, currentAccount?.did);
	const reportMessage = reportSubject && 'message' in reportSubject ? reportSubject.message : null;
	const reportDid = reportSubject && 'did' in reportSubject ? reportSubject.did : null;

	const { listBlocks, userBlock } = blockInfo;
	const isBlocking = userBlock || !!listBlocks.length;
	const isDeletedAccount = profile.handle === 'missing.invalid';
	const isGroupConvo = convo.view.kind?.$type === 'chat.bsky.convo.defs#groupConvo';

	const toggleBlock = () => {
		if (listBlocks.length) {
			blockedByListPromptHandle.open(null);
			return;
		}

		if (userBlock) {
			void queueUnblock();
		} else {
			void queueBlock();
		}
	};

	return (
		<>
			<Menu.Popup align="end" label={m['common.chat.settingsLabel']()}>
				{isDeletedAccount ? (
					<Menu.Item
						destructive
						label={m['components.dms.leave.action.conversation']()}
						onClick={() => leaveConvoPromptHandle.open(null)}
					>
						<Menu.ItemIcon icon={ArrowBoxLeftIcon} />
						<Menu.ItemText>{m['components.dms.leave.action.conversation']()}</Menu.ItemText>
					</Menu.Item>
				) : (
					<>
						<Menu.Group>
							{showMarkAsRead && (
								<Menu.Item
									label={m['components.dms.chat.action.markAsRead']()}
									onClick={() => markAsRead({ convoId })}
								>
									<Menu.ItemIcon icon={BubbleIcon} />
									<Menu.ItemText>{m['components.dms.chat.action.markAsRead']()}</Menu.ItemText>
								</Menu.Item>
							)}
							{isGroupConvo ? null : (
								<Menu.Item
									label={m['common.profile.a11y.goTo']()}
									onClick={() => router.navigate({ to: profileTarget(profile.did) })}
								>
									<Menu.ItemIcon icon={Person} />
									<Menu.ItemText>{m['common.profile.action.goTo']()}</Menu.ItemText>
								</Menu.Item>
							)}
							<Menu.Item
								label={m['components.dms.mute.action.mute']()}
								onClick={() => muteConvo({ mute: !liveConvo?.muted })}
							>
								<Menu.ItemIcon icon={liveConvo?.muted ? Unmute : Mute} />
								<Menu.ItemText>
									{liveConvo?.muted
										? m['components.dms.mute.action.unmute']()
										: m['components.dms.mute.action.mute']()}
								</Menu.ItemText>
							</Menu.Item>
						</Menu.Group>
						<Menu.Separator />
						<Menu.Group>
							{isGroupConvo ? null : (
								<Menu.Item
									destructive
									label={
										isBlocking
											? m['common.block.action.unblockAccount']()
											: m['common.block.action.blockAccount']()
									}
									onClick={toggleBlock}
								>
									<Menu.ItemIcon icon={isBlocking ? PersonCheck : PersonX} />
									<Menu.ItemText>
										{isBlocking
											? m['common.block.action.unblockAccount']()
											: m['common.block.action.blockAccount']()}
									</Menu.ItemText>
								</Menu.Item>
							)}
							{reportSubject && (
								<Menu.Item
									destructive
									label={m['common.chat.action.report']()}
									onClick={() => reportHandle.open(null)}
								>
									<Menu.ItemIcon icon={Flag} />
									<Menu.ItemText>{m['common.chat.action.report']()}</Menu.ItemText>
								</Menu.Item>
							)}
						</Menu.Group>
						<Menu.Separator />
						<Menu.Group>
							<Menu.Item
								destructive
								label={m['components.dms.leave.action.conversation']()}
								onClick={() => leaveConvoPromptHandle.open(null)}
							>
								<Menu.ItemIcon icon={ArrowBoxLeftIcon} />
								<Menu.ItemText>{m['components.dms.leave.action.conversation']()}</Menu.ItemText>
							</Menu.Item>
						</Menu.Group>
					</>
				)}
			</Menu.Popup>

			<LeaveConvoPrompt convoId={convoId} currentScreen={currentScreen} handle={leaveConvoPromptHandle} />
			<BlockedByListDialog handle={blockedByListPromptHandle} listBlocks={listBlocks} />
			{reportMessage ? (
				<>
					<ReportDialog
						handle={reportHandle}
						subject={{
							view: 'convo',
							convoId,
							message: reportMessage,
						}}
						onAfterSubmit={() => {
							const sender = convo.view.members.find((member) => member.did === reportMessage.sender.did);
							if (sender) {
								unstableCacheProfileView(queryClient, sender);
							}
							blockOrDeleteHandle.open(null);
						}}
					/>
					<AfterReportDialog
						currentScreen={currentScreen}
						handle={blockOrDeleteHandle}
						params={{
							convoId,
							did: reportMessage.sender.did,
						}}
					/>
				</>
			) : reportDid ? (
				<>
					<ReportConversationDialog
						convoId={convoId}
						did={reportDid}
						handle={reportHandle}
						onAfterSubmit={() => deleteHandle.open(null)}
					/>
					<AfterReportConversationDialog
						currentScreen={currentScreen}
						handle={deleteHandle}
						params={{
							convoId,
							did: reportDid,
						}}
					/>
				</>
			) : null}
		</>
	);
}
