import type { ReactNode } from 'react';

import type { ChatBskyActorDefs, ChatBskyConvoDefs } from '@atcute/bluesky';

import { useQueryClient } from '@tanstack/react-query';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useAcceptConversation } from '#/state/queries/messages/accept-conversation';
import { precacheConvoQuery } from '#/state/queries/messages/conversation';
import { useLeaveConvo } from '#/state/queries/messages/leave-conversation';
import { unstableCacheProfileView, useProfileBlockMutationQueue } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import * as Dialog from '#/components/Dialog';
import { AfterReportConversationDialog } from '#/components/dms/AfterReportConversationDialog';
import { AfterReportDialog } from '#/components/dms/AfterReportDialog';
import { ReportConversationDialog } from '#/components/dms/ReportConversationDialog';
import { getConvoReportSubject, type ConvoWithDetails } from '#/components/dms/util';
import * as Menu from '#/components/Menu';
import { ReportDialog } from '#/components/moderation/ReportDialog';
import * as Toast from '#/components/Toast';
import {
	Button as WebButton,
	ButtonIcon as WebButtonIcon,
	ButtonSpinner as WebButtonSpinner,
	type ButtonProps as WebButtonProps,
	ButtonText as WebButtonText,
} from '#/components/web/Button';

import LeaveIcon from '#/icons/central/ArrowBoxLeft_round_outlined_radius1_stroke2.svg';
import CheckIcon from '#/icons/central/Checkmark2_round_outlined_radius1_stroke2.svg';
import CircleXIcon from '#/icons/central/CircleX_round_outlined_radius1_stroke2.svg';
import FlagIcon from '#/icons/central/Flag1_round_outlined_radius1_stroke2.svg';
import PersonXIcon from '#/icons/central/PeopleRemove_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useRouter } from '#/router';

export function RejectMenu({
	convo,
	profile,
	size = 'small',
	color = 'secondary',
	label,
	icon = false,
	showDeleteConvo,
	currentScreen,
	className,
}: {
	color?: WebButtonProps['color'];
	size?: WebButtonProps['size'];
	className?: string;
	label?: string;
	icon?: boolean;
	convo: ConvoWithDetails;
	profile: ChatBskyActorDefs.ProfileViewBasic;
	showDeleteConvo?: boolean;
	currentScreen: 'list' | 'conversation';
}) {
	const { currentAccount } = useSession();
	const shadowedProfile = useProfileShadow(profile);
	const router = useRouter();
	const queryClient = useQueryClient();

	const { mutate: leaveConvo } = useLeaveConvo(convo.view.id, {
		onMutate: () => {
			if (currentScreen === 'conversation') {
				router.back();
			}
		},
		onError: () => {
			Toast.show(m['screens.messages.deleteChat.error'](), {
				type: 'error',
			});
		},
	});
	const [queueBlock] = useProfileBlockMutationQueue(shadowedProfile);

	const onPressDelete = () => {
		Toast.show(m['screens.messages.deleteChat.deletedToast'](), {
			type: 'success',
		});
		leaveConvo();
	};

	const onPressBlock = () => {
		Toast.show(m['common.block.blockedToast'](), {
			type: 'success',
		});
		// block and also delete convo
		void queueBlock();
		leaveConvo();
	};

	const reportHandle = Dialog.useDialogHandle();
	const blockOrDeleteHandle = Dialog.useDialogHandle();

	const reportSubject = getConvoReportSubject(convo, currentAccount?.did);
	const reportMessage = reportSubject && 'message' in reportSubject ? reportSubject.message : null;
	const reportDid = reportSubject && 'did' in reportSubject ? reportSubject.did : null;

	return (
		<>
			<Menu.Root>
				<Menu.Trigger
					render={
						<WebButton
							label={m['screens.messages.requests.reject.a11y']()}
							color={color}
							size={size}
							className={className}
						>
							{icon ? <WebButtonIcon icon={FlagIcon} /> : null}
							<WebButtonText>{label || m['screens.messages.requests.reject.action']()}</WebButtonText>
						</WebButton>
					}
				/>
				<Menu.Popup label={m['screens.messages.requests.reject.a11y']()}>
					<Menu.Group>
						{showDeleteConvo && (
							<Menu.Item label={m['common.chat.action.deleteConversation']()} onClick={onPressDelete}>
								<Menu.ItemText>{m['common.chat.action.deleteConversation']()}</Menu.ItemText>
								<Menu.ItemIcon icon={CircleXIcon} position="right" />
							</Menu.Item>
						)}
						<Menu.Item label={m['common.block.action.blockAccount']()} onClick={onPressBlock}>
							<Menu.ItemText>{m['common.block.action.blockAccount']()}</Menu.ItemText>
							<Menu.ItemIcon icon={PersonXIcon} position="right" />
						</Menu.Item>
						{reportSubject && (
							<Menu.Item label={m['common.chat.action.report']()} onClick={() => reportHandle.open(null)}>
								<Menu.ItemText>{m['common.chat.action.report']()}</Menu.ItemText>
								<Menu.ItemIcon icon={FlagIcon} position="right" />
							</Menu.Item>
						)}
					</Menu.Group>
				</Menu.Popup>
			</Menu.Root>
			{reportMessage ? (
				<>
					<ReportDialog
						subject={{
							view: 'convo',
							convoId: convo.view.id,
							message: reportMessage,
						}}
						handle={reportHandle}
						onAfterSubmit={() => {
							const sender = convo.view.members.find((member) => member.did === reportMessage.sender.did);
							if (sender) {
								unstableCacheProfileView(queryClient, sender);
							}
							blockOrDeleteHandle.open(null);
						}}
					/>
					<AfterReportDialog
						handle={blockOrDeleteHandle}
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
						handle={reportHandle}
						convoId={convo.view.id}
						did={reportDid}
						onAfterSubmit={() => blockOrDeleteHandle.open(null)}
					/>
					<AfterReportConversationDialog
						handle={blockOrDeleteHandle}
						currentScreen={currentScreen}
						params={{
							convoId: convo.view.id,
							did: reportDid,
						}}
					/>
				</>
			) : null}
		</>
	);
}

export function AcceptChatButton({
	convo,
	size = 'small',
	color = 'primary',
	icon = false,
	currentScreen,
	onAcceptConvo,
	...props
}: Omit<WebButtonProps, 'children' | 'label' | 'onClick'> & {
	icon?: boolean;
	convo: ChatBskyConvoDefs.ConvoView;
	onAcceptConvo?: () => void;
	currentScreen: 'list' | 'conversation';
}) {
	const queryClient = useQueryClient();
	const router = useRouter();

	const { mutate: acceptConvo, isPending } = useAcceptConversation(convo.id, {
		onMutate: () => {
			onAcceptConvo?.();
			if (currentScreen === 'list') {
				precacheConvoQuery(queryClient, { status: 'accepted', ...convo });
				router.navigate({ to: { name: 'MessagesConversation', accept: true, conversation: convo.id } });
			}
		},
		onError: () => {
			// the conversation accepts when the user sends a message, so only the no-send path differs.
			Toast.show(m['screens.messages.requests.accept.error'](), {
				type: 'error',
			});
		},
	});

	const onPressAccept = () => {
		acceptConvo();
	};

	let Icon: ReactNode = null;
	if (isPending) {
		Icon = (
			<WebButtonSpinner
				color={color === 'secondary' || props.variant === 'outline' ? 'default' : 'white'}
				label={m['common.status.loading']()}
			/>
		);
	} else if (icon) {
		Icon = <WebButtonIcon icon={CheckIcon} />;
	}

	return (
		<WebButton
			{...props}
			color={color}
			label={m['screens.messages.requests.accept.a11y']()}
			onClick={onPressAccept}
			size={size}
		>
			{Icon}
			<WebButtonText>{m['screens.messages.requests.accept.action']()}</WebButtonText>
		</WebButton>
	);
}

export function DeleteChatButton({
	convo,
	size = 'small',
	color = 'secondary',
	label,
	icon = false,
	currentScreen,
	...props
}: Omit<WebButtonProps, 'children' | 'label'> & {
	label?: string;
	icon?: boolean;
	convo: ChatBskyConvoDefs.ConvoView;
	currentScreen: 'list' | 'conversation';
}) {
	const router = useRouter();

	const { mutate: leaveConvo } = useLeaveConvo(convo.id, {
		onMutate: () => {
			if (currentScreen === 'conversation') {
				router.back();
			}
		},
		onError: () => {
			Toast.show(m['screens.messages.deleteChat.error'](), {
				type: 'error',
			});
		},
	});

	const onPressDelete = () => {
		Toast.show(m['screens.messages.deleteChat.deletedToast'](), {
			type: 'success',
		});
		leaveConvo();
	};

	return (
		<WebButton
			color={color}
			label={label || m['screens.messages.deleteChat.action']()}
			onClick={onPressDelete}
			size={size}
			{...props}
		>
			{icon ? <WebButtonIcon icon={LeaveIcon} /> : null}
			<WebButtonText>{label || m['screens.messages.deleteChat.action']()}</WebButtonText>
		</WebButton>
	);
}
