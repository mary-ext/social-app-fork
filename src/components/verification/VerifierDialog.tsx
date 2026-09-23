import { lazy, Suspense } from 'react';

import type { AnyProfileView } from '@atcute/bluesky';

import * as Dialog from '#/components/Dialog';

const VerifierDialogBody = lazy(() =>
	import('#/components/verification/VerifierDialogBody').then((mod) => ({ default: mod.VerifierDialogBody })),
);

export function VerifierDialog({
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
					<VerifierDialogBody handle={handle} profile={profile} />
				</Suspense>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
