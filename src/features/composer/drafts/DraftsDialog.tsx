import { lazy, Suspense } from 'react';

import type { AppBskyDraftDefs } from '@atcute/bluesky';

import * as Dialog from '#/components/Dialog';

import { m } from '#/paraglide/messages';

const DraftsDialogBody = lazy(() =>
	import('./DraftsDialogBody').then((mod) => ({ default: mod.DraftsDialogBody })),
);

/**
 * lists the account's saved drafts.
 *
 * @param props.handle opens the dialog
 * @param props.onSelect opens a draft in the composer; the dialog closes once it resolves
 * @returns the dialog
 */
export function DraftsDialog({
	handle,
	onSelect,
}: {
	handle: Dialog.DialogHandle;
	onSelect: (view: AppBskyDraftDefs.DraftView) => Promise<void>;
}) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup height="fixed" label={m['features.composer.drafts.title']()} scroll="body">
				<Suspense fallback={<Dialog.Loading fill />}>
					<DraftsDialogBody handle={handle} onSelect={onSelect} />
				</Suspense>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
