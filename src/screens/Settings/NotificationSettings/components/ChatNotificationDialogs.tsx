import { NotificationSettingsDialog } from '#/components/dialogs/NotificationSettingsDialog';
import type * as Dialog from '#/components/web/Dialog';

import { m } from '#/paraglide/messages';

export function ChatNotificationDialogs({
	chatHandle,
	chatRequestHandle,
}: {
	chatHandle: Dialog.DialogHandle;
	chatRequestHandle: Dialog.DialogHandle;
}) {
	return (
		<>
			<NotificationSettingsDialog
				allowDisableInApp={false}
				handle={chatHandle}
				name="chat"
				subtitleText={m['screens.settings.notifications.chat.newMessagesHint']()}
				titleText={m['screens.settings.notifications.chat.newMessages']()}
			/>
			<NotificationSettingsDialog
				allowDisableInApp={false}
				handle={chatRequestHandle}
				name="chatRequest"
				subtitleText={m['screens.settings.notifications.chat.newRequestsHint']()}
				titleText={m['screens.settings.notifications.chat.newRequests']()}
			/>
		</>
	);
}
