import { useGetConvoForMembers } from '#/state/queries/messages/get-convo-for-members';

import { logger } from '#/logger';

import * as Dialog from '#/components/Dialog';
import { SearchablePeopleList } from '#/components/dialogs/SearchablePeopleList';
import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

export function SendViaChatDialog({
	control,
	onSelectChat,
}: {
	control: Dialog.DialogControlProps;
	onSelectChat: (chatId: string) => void;
}) {
	return (
		<Dialog.Outer control={control} testID="sendViaChatChatDialog">
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
	const { mutate: createChat } = useGetConvoForMembers({
		onSuccess: (data) => {
			onSelectChat(data.convo.id);
		},
		onError: (error) => {
			logger.error('Failed to share post to chat', { message: error });
			Toast.show(m['components.dms.chat.error.open'](), {
				type: 'error',
			});
		},
	});

	const onSelectExistingChat = (chatId: string) => {
		control.close(() => onSelectChat(chatId));
	};

	const onCreateChat = (did: string) => {
		control.close(() => createChat([did]));
	};

	return (
		<SearchablePeopleList
			title={m['components.dms.share.title']()}
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
