import { lazy, Suspense } from 'react';

import type { AnyProfileView } from '@atcute/bluesky';
import type { ModerationOptions } from '@atcute/bluesky-moderation';

import * as Dialog from '#/components/Dialog';

const SubscribeProfileDialogBody = lazy(() =>
	import('./SubscribeProfileDialogBody').then((mod) => ({ default: mod.SubscribeProfileDialogBody })),
);

export function SubscribeProfileDialog({
	handle,
	profile,
	moderationOpts,
	includeProfile,
}: {
	handle: Dialog.DialogHandle;
	profile: AnyProfileView;
	moderationOpts: ModerationOptions;
	/** shows whose notifications are being edited. for callers opening this away from the profile itself. */
	includeProfile?: boolean;
}) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup size="narrow">
				<Suspense fallback={<Dialog.Loading />}>
					<SubscribeProfileDialogBody
						handle={handle}
						profile={profile}
						moderationOpts={moderationOpts}
						includeProfile={includeProfile}
					/>
				</Suspense>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
