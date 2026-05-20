import { useCallback } from 'react';
import { useLingui } from '@lingui/react/macro';

import { useGetConvoForMembers } from '#/state/queries/messages/get-convo-for-members';

import { logger } from '#/logger';

import * as Dialog from '#/components/Dialog';
import { SearchablePeopleList } from '#/components/dialogs/SearchablePeopleList';
import * as Toast from '#/components/Toast';

export function SendViaChatDialog({
	control,
	onSelectChat,
}: {
	control: Dialog.DialogControlProps;
	onSelectChat: (chatId: string) => void;
}) {
	return (
		<Dialog.Outer control={control} testID="sendViaChatChatDialog" nativeOptions={{ fullHeight: true }}>
			<Dialog.Handle />
			<SendViaChatDialogInner control={control} onSelectChat={onSelectChat} />
		</Dialog.Outer>
	);
}

function SendViaChatDialogInner({
	control,
	onSelectChat,
}: {
	control: Dialog.DialogControlProps;
	onSelectChat: (chatId: string) => void;
}) {
	const { t: l } = useLingui();
	const { mutate: createChat } = useGetConvoForMembers({
		onSuccess: (data) => {
			onSelectChat(data.convo.id);

			if (!data.convo.lastMessage) {
			}
		},
		onError: (error) => {
			logger.error('Failed to share post to chat', { message: error });
			Toast.show(l`An issue occurred while trying to open the chat`, {
				type: 'error',
			});
		},
	});

	const onSelectExistingChat = useCallback(
		(chatId: string) => {
			control.close(() => onSelectChat(chatId));
		},
		[control, onSelectChat],
	);

	const onCreateChat = useCallback(
		(did: string) => {
			control.close(() => createChat([did]));
		},
		[control, createChat],
	);

	return (
		<SearchablePeopleList
			title={l`Send post to...`}
			onSelectChat={(chat) => {
				if (chat.kind === 'user') {
					onCreateChat(chat.did);
				} else {
					onSelectExistingChat(chat.id);
				}
			}}
			showRecentConvos
			sortByMessageDeclaration
		/>
	);
}
