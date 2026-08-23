import { lazy, Suspense } from 'react';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import * as Dialog from '#/components/Dialog';
import * as css from '#/components/dms/dialogs/MemberPicker.css';

import { m } from '#/paraglide/messages';

const SendViaChatBody = lazy(() =>
	import('./SendViaChatBody').then((mod) => ({ default: mod.SendViaChatBody })),
);

export function SendViaChatDialog({
	handle,
	onSelectChat,
}: {
	handle: Dialog.DialogHandle;
	onSelectChat: (chatId: string) => void;
}) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup className={css.popup} label={m['components.dms.share.title']()} scroll="body">
				<Suspense fallback={<CenteredSpinner fill label={m['common.status.loading']()} size="xl" />}>
					<SendViaChatBody handle={handle} onSelectChat={onSelectChat} />
				</Suspense>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
