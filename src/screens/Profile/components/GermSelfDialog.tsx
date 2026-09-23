import { lazy, Suspense } from 'react';

import type { Did } from '@atcute/lexicons';

import * as Dialog from '#/components/Dialog';

const GermSelfDialogBody = lazy(() =>
	import('./GermSelfDialogBody').then((mod) => ({ default: mod.GermSelfDialogBody })),
);

/** Explains the viewer's own Germ DM link and lets them disconnect it. Opened from `GermSelfButton`. */
export function GermSelfDialog({ did, handle }: { did: Did; handle: Dialog.DialogHandle }) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup size="narrow">
				<Suspense fallback={<Dialog.Loading />}>
					<GermSelfDialogBody did={did} handle={handle} />
				</Suspense>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
