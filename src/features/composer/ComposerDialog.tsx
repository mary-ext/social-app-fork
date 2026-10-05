import { lazy, Suspense, useRef } from 'react';

import * as Dialog from '#/components/Dialog';

import { m } from '#/paraglide/messages';

import { composerDialogHandle } from './open-composer';
import type { ComposerCloseGuard } from './ThreadComposer';

const ThreadComposer = lazy(() =>
	import('./ThreadComposer').then((mod) => ({ default: mod.ThreadComposer })),
);

/**
 * renders the global composer dialog.
 *
 * @returns the composer dialog
 */
export function ComposerDialog() {
	const closeGuardRef = useRef<ComposerCloseGuard>(null);

	return (
		<Dialog.Root
			handle={composerDialogHandle}
			onOpenChange={(open, details) => {
				// confirmed discards close imperatively; don't prompt again.
				if (!open && details.reason !== 'imperative-action' && closeGuardRef.current?.interceptClose()) {
					details.cancel();
				}
			}}
		>
			{({ payload }) => (
				<Dialog.Popup label={m['common.compose.action.write']()} padding="none" scroll="body">
					{payload && (
						<Suspense fallback={<Dialog.Loading minHeight={263} />}>
							<ThreadComposer
								quoteUri={payload.quote?.uri}
								replyUri={payload.replyTo?.uri}
								initialText={payload.text}
								initialVideo={payload.video}
								onPostSuccess={payload.onPostSuccess}
								closeGuardRef={closeGuardRef}
							/>
						</Suspense>
					)}
				</Dialog.Popup>
			)}
		</Dialog.Root>
	);
}
