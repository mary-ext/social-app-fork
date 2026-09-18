import { lazy, Suspense, useState } from 'react';

import type { AppBskyActorDefs } from '@atcute/bluesky';

import * as Dialog from '#/components/Dialog';
import * as Prompt from '#/components/Prompt';
import { Spinner } from '#/components/Spinner';

import { m } from '#/paraglide/messages';

const EditProfileDialogContent = lazy(() =>
	import('./EditProfileDialogContent').then((mod) => ({ default: mod.EditProfileDialogContent })),
);

export function EditProfileDialog({
	profile,
	handle,
}: {
	profile: AppBskyActorDefs.ProfileViewDetailed;
	handle: Dialog.DialogHandle;
}) {
	const cancelHandle = Prompt.usePromptHandle();
	const [dirty, setDirty] = useState(false);

	return (
		<>
			<Dialog.Root
				handle={handle}
				onOpenChange={(open, details) => {
					// guard every non-imperative dismissal while dirty (escape/backdrop, and the focus-out
					// caused by the discard prompt itself) — save/discard close imperatively and pass through
					if (!open && dirty && details.reason !== 'imperative-action') {
						details.cancel();
						cancelHandle.open(null);
					}
				}}
			>
				<Dialog.Popup label={m['screens.profile.editProfile.action']()} scroll="body">
					<Suspense
						fallback={
							<Dialog.Body>
								<Spinner color="default" label={m['common.status.loading']()} size="xl" />
							</Dialog.Body>
						}
					>
						<EditProfileDialogContent
							profile={profile}
							handle={handle}
							cancelHandle={cancelHandle}
							setDirty={setDirty}
						/>
					</Suspense>
				</Dialog.Popup>
			</Dialog.Root>
			<Prompt.Basic
				handle={cancelHandle}
				title={m['common.discardChanges.title']()}
				description={m['common.discardChanges.message']()}
				onConfirm={() => handle.close()}
				confirmButtonCta={m['common.action.discard']()}
				confirmButtonColor="negative"
			/>
		</>
	);
}
