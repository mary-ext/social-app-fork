import { lazy, Suspense } from 'react';

import * as Dialog from '#/components/Dialog';

import { m } from '#/paraglide/messages';

const SuggestedFollowsDialogBody = lazy(() =>
	import('#/components/SuggestedFollowsDialogBody').then((mod) => ({
		default: mod.SuggestedFollowsDialogBody,
	})),
);

export function SuggestedFollowsDialog({ handle }: { handle: Dialog.DialogHandle }) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup
				height="fixed"
				label={m['components.dialogs.suggestedFollows.title']()}
				scroll="body"
				size="wide"
			>
				<Suspense fallback={<Dialog.Loading fill />}>
					<SuggestedFollowsDialogBody handle={handle} />
				</Suspense>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
