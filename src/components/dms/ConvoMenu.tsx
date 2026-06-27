import { useCallback } from 'react';
import { View } from 'react-native';
import type { AnyProfileView, ChatBskyConvoDefs } from '@atcute/bluesky';
import type { BlockingModerationCause } from '@atcute/bluesky-moderation';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';

import type { NavigationProp } from '#/lib/routes/types';

import type { Shadow } from '#/state/cache/types';
import { useConvoQuery, useMarkAsReadMutation } from '#/state/queries/messages/conversation';
import { useMuteConvo } from '#/state/queries/messages/mute-conversation';
import { unstableCacheProfileView, useProfileBlockMutationQueue } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import type { ViewStyleProp } from '#/alf';

import { AfterReportConversationDialog } from '#/components/dms/AfterReportConversationDialog';
import { AfterReportDialog } from '#/components/dms/AfterReportDialog';
import { BlockedByListDialog } from '#/components/dms/BlockedByListDialog';
import { LeaveConvoPrompt } from '#/components/dms/LeaveConvoPrompt';
import { ReportConversationDialog } from '#/components/dms/ReportConversationDialog';
import { getConvoReportSubject, type ConvoWithDetails } from '#/components/dms/util';
import { ArrowBoxLeft_Stroke2_Corner0_Rounded as ArrowBoxLeftIcon } from '#/components/icons/ArrowBoxLeft';
import { Bubble_Stroke2_Corner2_Rounded as BubbleIcon } from '#/components/icons/Bubble';
import { DotGrid3x1_Stroke2_Corner0_Rounded as DotsHorizontalIcon } from '#/components/icons/DotGrid';
import { Flag_Stroke2_Corner0_Rounded as Flag } from '#/components/icons/Flag';
import { Mute_Stroke2_Corner0_Rounded as Mute } from '#/components/icons/Mute';
import {
	Person_Stroke2_Corner0_Rounded as Person,
	PersonCheck_Stroke2_Corner0_Rounded as PersonCheck,
	PersonX_Stroke2_Corner0_Rounded as PersonX,
} from '#/components/icons/Person';
import { SpeakerVolumeFull_Stroke2_Corner0_Rounded as Unmute } from '#/components/icons/Speaker';
import { ReportDialog } from '#/components/moderation/ReportDialog';
import * as Prompt from '#/components/Prompt';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon } from '#/components/web/Button';
import { type DialogHandle, useDialogHandle } from '#/components/web/Dialog';
import * as Menu from '#/components/web/Menu';

import { m } from '#/paraglide/messages';

function ConvoMenu({
	convo,
	profile,
	control,
	triggerId,
	onOpenChange,
	currentScreen,
	showMarkAsRead,
	blockInfo,
	style,
}: {
	convo: ConvoWithDetails;
	profile: Shadow<AnyProfileView>;
	control?: Menu.MenuHandle;
	/** DOM id of the trigger, so a detached opener (the chat row) can anchor the menu to it. */
	triggerId?: string;
	onOpenChange?: (open: boolean) => void;
	currentScreen: 'list' | 'conversation';
	showMarkAsRead?: boolean;
	blockInfo: {
		listBlocks: BlockingModerationCause[];
		userBlock?: BlockingModerationCause;
	};
	style?: ViewStyleProp['style'];
}): React.ReactNode {
	const queryClient = useQueryClient();
	const { currentAccount } = useSession();

	const reportSubject = getConvoReportSubject(convo, currentAccount?.did);
	const reportMessage = reportSubject && 'message' in reportSubject ? reportSubject.message : null;
	const reportDid = reportSubject && 'did' in reportSubject ? reportSubject.did : null;

	const leaveConvoControl = Prompt.usePromptControl();
	const reportControl = useDialogHandle();
	const blockedByListControl = Prompt.usePromptControl();
	const blockOrDeleteControl = Prompt.usePromptControl();
	const deleteControl = Prompt.usePromptControl();

	const { listBlocks } = blockInfo;

	return (
		<>
			<Menu.Root handle={control} onOpenChange={onOpenChange}>
				<View style={[style]}>
					<Menu.Trigger
						handle={control}
						id={triggerId}
						render={
							<Button
								label={m['common.chat.settingsLabel']()}
								size="small"
								color="secondary"
								shape="round"
								variant="ghost"
							>
								<ButtonIcon icon={DotsHorizontalIcon} size="md" />
							</Button>
						}
					/>
				</View>

				<Menu.Popup label={m['common.chat.settingsLabel']()}>
					<MenuContent
						profile={profile}
						showMarkAsRead={showMarkAsRead}
						blockInfo={blockInfo}
						convo={convo.view}
						leaveConvoControl={leaveConvoControl}
						canReport={!!reportSubject}
						reportControl={reportControl}
						blockedByListControl={blockedByListControl}
					/>
				</Menu.Popup>
			</Menu.Root>
			<LeaveConvoPrompt control={leaveConvoControl} convoId={convo.view.id} currentScreen={currentScreen} />
			{reportMessage ? (
				<>
					<ReportDialog
						subject={{
							view: 'convo',
							convoId: convo.view.id,
							message: reportMessage,
						}}
						control={reportControl}
						onAfterSubmit={() => {
							const sender = convo.view.members.find((member) => member.did === reportMessage.sender.did);
							if (sender) {
								unstableCacheProfileView(queryClient, sender);
							}
							blockOrDeleteControl.open();
						}}
					/>
					<AfterReportDialog
						control={blockOrDeleteControl}
						currentScreen={currentScreen}
						params={{
							convoId: convo.view.id,
							did: reportMessage.sender.did,
						}}
					/>
				</>
			) : reportDid ? (
				<>
					<ReportConversationDialog
						control={reportControl}
						convoId={convo.view.id}
						did={reportDid}
						onAfterSubmit={deleteControl.open}
					/>
					<AfterReportConversationDialog
						control={deleteControl}
						currentScreen={currentScreen}
						params={{
							convoId: convo.view.id,
							did: reportDid,
						}}
					/>
				</>
			) : null}
			<BlockedByListDialog control={blockedByListControl} listBlocks={listBlocks} />
		</>
	);
}

function MenuContent({
	convo: initialConvo,
	profile,
	showMarkAsRead,
	blockInfo,
	leaveConvoControl,
	canReport,
	reportControl,
	blockedByListControl,
}: {
	convo: ChatBskyConvoDefs.ConvoView;
	profile: Shadow<AnyProfileView>;
	showMarkAsRead?: boolean;
	blockInfo: {
		listBlocks: BlockingModerationCause[];
		userBlock?: BlockingModerationCause;
	};
	leaveConvoControl: Prompt.PromptControlProps;
	canReport: boolean;
	reportControl: DialogHandle;
	blockedByListControl: Prompt.PromptControlProps;
}) {
	const navigation = useNavigation<NavigationProp>();
	const { mutate: markAsRead } = useMarkAsReadMutation();

	const { listBlocks, userBlock } = blockInfo;
	const isBlocking = userBlock || !!listBlocks.length;
	const isDeletedAccount = profile.handle === 'missing.invalid';
	const isGroupConvo = initialConvo.kind?.$type === 'chat.bsky.convo.defs#groupConvo';

	const convoId = initialConvo.id;
	const { data: convo } = useConvoQuery({ convoId });

	const onNavigateToProfile = useCallback(() => {
		navigation.navigate('Profile', { name: profile.did });
	}, [navigation, profile.did]);

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

	const toggleBlock = useCallback(() => {
		if (listBlocks.length) {
			blockedByListControl.open();
			return;
		}

		if (userBlock) {
			void queueUnblock();
		} else {
			void queueBlock();
		}
	}, [userBlock, listBlocks, blockedByListControl, queueBlock, queueUnblock]);

	return isDeletedAccount ? (
		<Menu.Item
			destructive
			label={m['components.dms.leave.action.conversation']()}
			onClick={leaveConvoControl.open}
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
					<Menu.Item label={m['common.profile.a11y.goTo']()} onClick={onNavigateToProfile}>
						<Menu.ItemIcon icon={Person} />
						<Menu.ItemText>{m['common.profile.action.goTo']()}</Menu.ItemText>
					</Menu.Item>
				)}
				<Menu.Item
					label={m['components.dms.mute.action.mute']()}
					onClick={() => muteConvo({ mute: !convo?.muted })}
				>
					<Menu.ItemIcon icon={convo?.muted ? Unmute : Mute} />
					<Menu.ItemText>
						{convo?.muted ? m['components.dms.mute.action.unmute']() : m['components.dms.mute.action.mute']()}
					</Menu.ItemText>
				</Menu.Item>
			</Menu.Group>
			<Menu.Separator />
			<Menu.Group>
				{isGroupConvo ? null : (
					<Menu.Item
						destructive
						label={
							isBlocking ? m['common.block.action.unblockAccount']() : m['common.block.action.blockAccount']()
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
				{canReport && (
					<Menu.Item
						destructive
						label={m['common.chat.action.report']()}
						onClick={() => reportControl.open(null)}
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
					onClick={leaveConvoControl.open}
				>
					<Menu.ItemIcon icon={ArrowBoxLeftIcon} />
					<Menu.ItemText>{m['components.dms.leave.action.conversation']()}</Menu.ItemText>
				</Menu.Item>
			</Menu.Group>
		</>
	);
}

export { ConvoMenu };
