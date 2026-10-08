import { lazy, Suspense } from 'react';

import type { AppBskyActorDefs, AppBskyEmbedExternal } from '@atcute/bluesky';

import * as Dialog from '#/components/Dialog';

const EditLiveDialogBody = lazy(() =>
	import('./EditLiveDialogBody').then((mod) => ({ default: mod.EditLiveDialogBody })),
);

export function EditLiveDialog({
	embed,
	handle,
	status,
}: {
	embed: AppBskyEmbedExternal.View;
	handle: Dialog.DialogHandle;
	status: AppBskyActorDefs.StatusView;
}) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup size="narrow">
				<Suspense fallback={<Dialog.Loading />}>
					<EditLiveDialogBody embed={embed} handle={handle} status={status} />
				</Suspense>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
