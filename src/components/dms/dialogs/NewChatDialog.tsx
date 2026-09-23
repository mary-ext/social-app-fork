import { lazy, Suspense } from 'react';

import * as Dialog from '#/components/Dialog';

import { m } from '#/paraglide/messages';

const NewChatDialogBody = lazy(() =>
	import('#/components/dms/dialogs/NewChatDialogBody').then((mod) => ({ default: mod.NewChatDialogBody })),
);

export function NewChatDialog({
	handle,
	onNewChat,
}: {
	handle: Dialog.DialogHandle;
	onNewChat: (chatId: string) => void;
}) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup height="fixed" label={m['common.chat.action.new']()} scroll="body" size="wide">
				<Suspense fallback={<Dialog.Loading fill />}>
					<NewChatDialogBody handle={handle} onNewChat={onNewChat} />
				</Suspense>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
