import { lazy, Suspense } from 'react';

import type { AnyProfileView } from '@atcute/bluesky';

import * as Dialog from '#/components/Dialog';

const VerificationsDialogBody = lazy(() =>
	import('#/components/verification/VerificationsDialogBody').then((mod) => ({
		default: mod.VerificationsDialogBody,
	})),
);

export function VerificationsDialog({
	handle,
	profile,
}: {
	handle: Dialog.DialogHandle;
	profile: AnyProfileView;
}) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup size="narrow">
				<Suspense fallback={<Dialog.Loading />}>
					<VerificationsDialogBody handle={handle} profile={profile} />
				</Suspense>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
