import { lazy, Suspense } from 'react';

import * as Dialog from '#/components/Dialog';
import { signinDialogHandle, type SigninDialogPayload } from '#/components/dialogs/handles';

const SigninBody = lazy(() =>
	import('#/components/dialogs/SigninBody').then((mod) => ({ default: mod.SigninBody })),
);

export function SigninDialog() {
	return (
		<Dialog.Root handle={signinDialogHandle}>
			{({ payload }: { payload: SigninDialogPayload | undefined }) =>
				payload ? (
					<Dialog.Popup size="narrow">
						<Suspense fallback={<Dialog.Loading />}>
							<SigninBody close={() => signinDialogHandle.close()} payload={payload} />
						</Suspense>
					</Dialog.Popup>
				) : null
			}
		</Dialog.Root>
	);
}
