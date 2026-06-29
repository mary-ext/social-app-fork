import { useCallback } from 'react';
import { ClientResponseError } from '@atcute/client';

import { isNetworkError } from '#/lib/strings/errors';

import { useCreateGroupChat } from '#/state/queries/messages/create-group-chat';
import { useGetConvoForMembers } from '#/state/queries/messages/get-convo-for-members';
import { useChatActorStatusQuery } from '#/state/queries/messages/get-status';

import { logger } from '#/logger';

import { FAB } from '#/view/com/util/fab/FAB';

import * as Dialog from '#/components/Dialog';
import { InitiateChatFlow } from '#/components/dms/InitiateChatFlow';
import { MessagePlus_Stroke2_Corner0_Rounded as NewChatIcon } from '#/components/icons/Message';
import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

export function NewChat({
	control,
	onNewChat,
}: {
	control: Dialog.DialogControlProps;
	onNewChat: (chatId: string) => void;
}) {
	const { data: chatStatus } = useChatActorStatusQuery();
	const chatDisabled = !!chatStatus?.chatDisabled;

	const { mutate: createChat } = useGetConvoForMembers({
		onSuccess: (data) => {
			onNewChat(data.convo.id);
		},
		onError: (error) => {
			logger.error('Failed to create chat', { safeMessage: error });
			let errorMessage = m['components.dms.chat.error.start']();
			if (isNetworkError(error)) {
				errorMessage = m['common.error.network']();
			} else if (error instanceof ClientResponseError) {
				switch (error.error) {
					case 'AccountSuspended': {
						errorMessage = m['components.dms.chat.error.suspended']();
						break;
					}
					case 'BlockedActor': {
						errorMessage = m['components.dms.block.userBlockedYou']();
						break;
					}
					case 'MessagesDisabled': {
						errorMessage = m['components.dms.chat.error.userDisabled']();
						break;
					}
					case 'NotFollowedBySender': {
						errorMessage = m['components.dms.chat.error.recipientNotFollowed']();
						break;
					}
					case 'RecipientNotFound': {
						errorMessage = m['components.dms.recipient.error.selectedNotFound']();
						break;
					}
				}
			}
			Toast.show(errorMessage, {
				type: 'error',
			});
		},
	});

	const { mutate: createGroupChat } = useCreateGroupChat({
		onSuccess: (data) => {
			onNewChat(data.convo.id);
		},
		onError: (error) => {
			logger.error('Failed to create groupchat', { safeMessage: error });
			let errorMessage = m['components.dms.group.error.create']();
			if (isNetworkError(error)) {
				errorMessage = m['common.error.network']();
			} else if (error instanceof ClientResponseError) {
				switch (error.error) {
					case 'AccountSuspended': {
						errorMessage = m['components.dms.group.error.suspended']();
						break;
					}
					case 'BlockedActor': {
						errorMessage = m['components.dms.recipient.error.blockedYou']();
						break;
					}
					case 'NewAccountCannotCreateGroup': {
						errorMessage = m['components.dms.group.error.cannotCreateYet']();
						break;
					}
					case 'NotFollowedBySender': {
						errorMessage = m['components.dms.recipient.error.notFollowed']();
						break;
					}
					case 'RecipientNotFound': {
						errorMessage = m['components.dms.recipient.error.notFound']();
						break;
					}
					case 'UserForbidsGroups': {
						errorMessage = m['components.dms.recipient.error.noGroups']();
						break;
					}
				}
			}
			Toast.show(errorMessage, {
				type: 'error',
			});
		},
	});

	const onCreateChat = useCallback(
		(did: string) => {
			control.close(() => createChat([did]));
		},
		[control, createChat],
	);

	const onCreateGroupChat = useCallback(
		(members: string[], name: string) => {
			control.close(() => {
				createGroupChat({ members, name });
			});
		},
		[control, createGroupChat],
	);

	const onPress = useCallback(() => {
		control.open();
	}, [control]);
	const wrappedOnPress = onPress;

	return (
		<>
			{!chatDisabled && (
				<FAB
					icon={<NewChatIcon size="xl" fill={colors.white} />}
					label={m['common.chat.action.new']()}
					onClick={wrappedOnPress}
				/>
			)}
			<Dialog.Outer control={control} testID="newChatDialog">
				<Dialog.Handle />
				<InitiateChatFlow
					title={m['common.chat.action.new']()}
					onSelectChat={onCreateChat}
					onSelectGroupChat={onCreateGroupChat}
				/>
			</Dialog.Outer>
		</>
	);
}
