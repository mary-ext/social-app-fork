import { useGetConvoForMembers } from '#/state/queries/messages/get-convo-for-members';

import { logger } from '#/logger';

import { SearchablePeopleList } from '#/components/dialogs/SearchablePeopleList';
import * as Toast from '#/components/Toast';
import * as Dialog from '#/components/web/Dialog';

import { m } from '#/paraglide/messages';

export function SendViaChatDialog({
	handle,
	onSelectChat,
}: {
	handle: Dialog.DialogHandle;
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

	return (
		<SearchablePeopleList
			handle={handle}
			onSelectChat={(chat) => {
				handle.close();
				if (chat.kind === 'user') {
					createChat([chat.did]);
				} else {
					onSelectChat(chat.id);
				}
			}}
			showRecentConvos
			sortByMessageDeclaration
			title={m['components.dms.share.title']()}
		/>
	);
}
