import { useCallback } from 'react';
import type { ChatBskyActorDefs, ChatBskyConvoDefs } from '@atcute/bluesky';
import { Trans, useLingui } from '@lingui/react/macro';
import { StackActions, useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';

import type { NavigationProp } from '#/lib/routes/types';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useAcceptConversation } from '#/state/queries/messages/accept-conversation';
import { precacheConvoQuery } from '#/state/queries/messages/conversation';
import { useLeaveConvo } from '#/state/queries/messages/leave-conversation';
import { unstableCacheProfileView, useProfileBlockMutationQueue } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { Button, ButtonIcon, type ButtonProps, ButtonText } from '#/components/Button';
import { useDialogControl } from '#/components/Dialog';
import { AfterReportConversationDialog } from '#/components/dms/AfterReportConversationDialog';
import { AfterReportDialog } from '#/components/dms/AfterReportDialog';
import { ReportConversationDialog } from '#/components/dms/ReportConversationDialog';
import { getConvoReportSubject, type ConvoWithDetails } from '#/components/dms/util';
import { ArrowBoxLeft_Stroke2_Corner0_Rounded as LeaveIcon } from '#/components/icons/ArrowBoxLeft';
import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import { CircleX_Stroke2_Corner0_Rounded } from '#/components/icons/CircleX';
import { Flag_Stroke2_Corner0_Rounded as FlagIcon } from '#/components/icons/Flag';
import { PersonX_Stroke2_Corner0_Rounded as PersonXIcon } from '#/components/icons/Person';
import { Loader } from '#/components/Loader';
import { ReportDialog } from '#/components/moderation/ReportDialog';
import * as Toast from '#/components/Toast';
import {
	Button as WebButton,
	ButtonIcon as WebButtonIcon,
	type ButtonProps as WebButtonProps,
	ButtonText as WebButtonText,
} from '#/components/web/Button';
import { useDialogHandle } from '#/components/web/Dialog';
import * as Menu from '#/components/web/Menu';

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
	const { t: l } = useLingui();
	const { currentAccount } = useSession();
	const shadowedProfile = useProfileShadow(profile);
	const navigation = useNavigation<NavigationProp>();
	const queryClient = useQueryClient();

	const { mutate: leaveConvo } = useLeaveConvo(convo.view.id, {
		onMutate: () => {
			if (currentScreen === 'conversation') {
				navigation.dispatch(StackActions.pop());
			}
		},
		onError: () => {
			Toast.show(
				l({
					context: 'toast',
					message: 'Failed to delete chat',
				}),
				{
					type: 'error',
				},
			);
		},
	});
	const [queueBlock] = useProfileBlockMutationQueue(shadowedProfile);

	const onPressDelete = useCallback(() => {
		Toast.show(
			l({
				context: 'toast',
				message: 'Chat deleted',
			}),
			{
				type: 'success',
			},
		);
		leaveConvo();
	}, [leaveConvo, l]);

	const onPressBlock = useCallback(() => {
		Toast.show(
			l({
				context: 'toast',
				message: 'Account blocked',
			}),
			{
				type: 'success',
			},
		);
		// block and also delete convo
		void queueBlock();
		leaveConvo();
	}, [queueBlock, leaveConvo, l]);

	const reportControl = useDialogHandle();
	const blockOrDeleteControl = useDialogControl();

	const reportSubject = getConvoReportSubject(convo, currentAccount?.did);
	const reportMessage = reportSubject && 'message' in reportSubject ? reportSubject.message : null;
	const reportDid = reportSubject && 'did' in reportSubject ? reportSubject.did : null;

	return (
		<>
			<Menu.Root>
				<Menu.Trigger
					render={
						<WebButton label={l`Reject chat request`} color={color} size={size} className={className}>
							{icon ? <WebButtonIcon icon={FlagIcon} /> : null}
							<WebButtonText>
								{label || (
									<Trans comment="Reject a chat request, this opens a menu with options">Reject</Trans>
								)}
							</WebButtonText>
						</WebButton>
					}
				/>
				<Menu.Popup label={l`Reject chat request`}>
					<Menu.Group>
						{showDeleteConvo && (
							<Menu.Item label={l`Delete conversation`} onClick={onPressDelete}>
								<Menu.ItemText>
									<Trans>Delete conversation</Trans>
								</Menu.ItemText>
								<Menu.ItemIcon icon={CircleX_Stroke2_Corner0_Rounded} position="right" />
							</Menu.Item>
						)}
						<Menu.Item label={l`Block account`} onClick={onPressBlock}>
							<Menu.ItemText>
								<Trans>Block account</Trans>
							</Menu.ItemText>
							<Menu.ItemIcon icon={PersonXIcon} position="right" />
						</Menu.Item>
						{reportSubject && (
							<Menu.Item label={l`Report conversation`} onClick={() => reportControl.open(null)}>
								<Menu.ItemText>
									<Trans>Report conversation</Trans>
								</Menu.ItemText>
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
						onAfterSubmit={blockOrDeleteControl.open}
					/>
					<AfterReportConversationDialog
						control={blockOrDeleteControl}
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
	label,
	icon = false,
	currentScreen,
	onAcceptConvo,
	...props
}: Omit<ButtonProps, 'onPress' | 'children' | 'label'> & {
	label?: string;
	icon?: boolean;
	convo: ChatBskyConvoDefs.ConvoView;
	onAcceptConvo?: () => void;
	currentScreen: 'list' | 'conversation';
}) {
	const { t: l } = useLingui();
	const queryClient = useQueryClient();
	const navigation = useNavigation<NavigationProp>();

	const { mutate: acceptConvo, isPending } = useAcceptConversation(convo.id, {
		onMutate: () => {
			onAcceptConvo?.();
			if (currentScreen === 'list') {
				precacheConvoQuery(queryClient, { ...convo, status: 'accepted' });
				navigation.navigate('MessagesConversation', {
					conversation: convo.id,
					accept: true,
				});
			}
		},
		onError: () => {
			// Should we show a toast here? They'll be on the convo screen, and it'll make
			// no difference if the request failed - when they send a message, the convo will be accepted
			// automatically. The only difference is that when they back out of the convo (without sending a message), the conversation will be rejected.
			// the list will still have this chat in it -sfn
			Toast.show(
				l({
					context: 'toast',
					message: 'Failed to accept chat',
				}),
				{
					type: 'error',
				},
			);
		},
	});

	const onPressAccept = useCallback(() => {
		acceptConvo();
	}, [acceptConvo]);

	let Icon: React.ReactNode = null;
	if (isPending) {
		Icon = <ButtonIcon icon={Loader} />;
	} else if (icon) {
		Icon = <ButtonIcon icon={CheckIcon} />;
	}

	return (
		<Button
			{...props}
			label={label || l`Accept chat request`}
			size={size}
			color={color}
			onPress={onPressAccept}
		>
			{Icon}
			<ButtonText>{label || <Trans comment="Accept a chat request">Accept</Trans>}</ButtonText>
		</Button>
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
}: Omit<ButtonProps, 'children' | 'label'> & {
	label?: string;
	icon?: boolean;
	convo: ChatBskyConvoDefs.ConvoView;
	currentScreen: 'list' | 'conversation';
}) {
	const { t: l } = useLingui();
	const navigation = useNavigation<NavigationProp>();

	const { mutate: leaveConvo } = useLeaveConvo(convo.id, {
		onMutate: () => {
			if (currentScreen === 'conversation') {
				navigation.dispatch(StackActions.pop());
			}
		},
		onError: () => {
			Toast.show(
				l({
					context: 'toast',
					message: 'Failed to delete chat',
				}),
				{
					type: 'error',
				},
			);
		},
	});

	const onPressDelete = useCallback(() => {
		Toast.show(
			l({
				context: 'toast',
				message: 'Chat deleted',
			}),
			{
				type: 'success',
			},
		);
		leaveConvo();
	}, [leaveConvo, l]);

	return (
		<Button label={label || l`Delete chat`} size={size} color={color} onPress={onPressDelete} {...props}>
			{icon ? <ButtonIcon icon={LeaveIcon} /> : null}
			<ButtonText>{label || <Trans>Delete chat</Trans>}</ButtonText>
		</Button>
	);
}
