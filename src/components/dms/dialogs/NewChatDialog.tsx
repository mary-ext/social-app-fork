import { useCallback } from 'react';
import { ClientResponseError } from '@atcute/client';
import { useLingui } from '@lingui/react/macro';

import { isNetworkError } from '#/lib/strings/errors';

import { useCreateGroupChat } from '#/state/queries/messages/create-group-chat';
import { useGetConvoForMembers } from '#/state/queries/messages/get-convo-for-members';
import { useChatActorStatusQuery } from '#/state/queries/messages/get-status';

import { logger } from '#/logger';

import { FAB } from '#/view/com/util/fab/FAB';

import { useTheme } from '#/alf';

import * as Dialog from '#/components/Dialog';
import { InitiateChatFlow } from '#/components/dms/InitiateChatFlow';
import { MessagePlus_Stroke2_Corner0_Rounded as NewChatIcon } from '#/components/icons/Message';
import * as Toast from '#/components/Toast';

export function NewChat({
	control,
	onNewChat,
}: {
	control: Dialog.DialogControlProps;
	onNewChat: (chatId: string) => void;
}) {
	const t = useTheme();
	const { t: l } = useLingui();
	const { data: chatStatus } = useChatActorStatusQuery();
	const chatDisabled = !!chatStatus?.chatDisabled;

	const { mutate: createChat } = useGetConvoForMembers({
		onSuccess: (data) => {
			onNewChat(data.convo.id);
		},
		onError: (error) => {
			logger.error('Failed to create chat', { safeMessage: error });
			let errorMessage = l`An issue occurred starting the chat, please try again.`;
			if (isNetworkError(error)) {
				errorMessage = l`A network error occurred. Please check your internet connection.`;
			} else if (error instanceof ClientResponseError) {
				switch (error.error) {
					case 'AccountSuspended': {
						errorMessage = l`Suspended accounts cannot participate in chat.`;
						break;
					}
					case 'BlockedActor': {
						errorMessage = l`This user has blocked you and cannot be messaged.`;
						break;
					}
					case 'MessagesDisabled': {
						errorMessage = l`This user has disabled chat and cannot be messaged.`;
						break;
					}
					case 'NotFollowedBySender': {
						errorMessage = l`Chat recipient is not followed by the sender.`;
						break;
					}
					case 'RecipientNotFound': {
						errorMessage = l`Unable to find the selected recipient.`;
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
			let errorMessage = l`An issue occurred creating the group chat, please try again.`;
			if (isNetworkError(error)) {
				errorMessage = l`A network error occurred. Please check your internet connection.`;
			} else if (error instanceof ClientResponseError) {
				switch (error.error) {
					case 'AccountSuspended': {
						errorMessage = l`Suspended accounts cannot participate in a group chat.`;
						break;
					}
					case 'BlockedActor': {
						errorMessage = l`One of the selected recipients has blocked you and cannot be messaged.`;
						break;
					}
					case 'NewAccountCannotCreateGroup': {
						errorMessage = l`You cannot create a group chat yet.`;
						break;
					}
					case 'NotFollowedBySender': {
						errorMessage = l`A selected recipient is not followed by the sender.`;
						break;
					}
					case 'RecipientNotFound': {
						errorMessage = l`Unable to find a selected recipient.`;
						break;
					}
					case 'UserForbidsGroups': {
						errorMessage = l`One of the selected recipients does not allow group chats.`;
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
					icon={<NewChatIcon size="lg" fill={t.palette.white} />}
					label={l`New chat`}
					onClick={wrappedOnPress}
				/>
			)}
			<Dialog.Outer control={control} testID="newChatDialog">
				<Dialog.Handle />
				<InitiateChatFlow
					title={l`New chat`}
					onSelectChat={onCreateChat}
					onSelectGroupChat={onCreateGroupChat}
				/>
			</Dialog.Outer>
		</>
	);
}
