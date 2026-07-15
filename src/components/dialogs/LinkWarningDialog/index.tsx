import { lazy, Suspense } from 'react';

import * as Dialog from '#/components/Dialog';
import { type LinkWarningPayload, useGlobalDialogsHandleContext } from '#/components/dialogs/Context';
import { Spinner } from '#/components/Spinner';

import { m } from '#/paraglide/messages';

import * as css from './LinkWarningDialog.css';

const WarningBody = lazy(() => import('./WarningBody').then((mod) => ({ default: mod.WarningBody })));

export function LinkWarningDialog() {
	const { linkWarningDialogHandle } = useGlobalDialogsHandleContext();
	return <LinkWarningDialogBase handle={linkWarningDialogHandle} />;
}

export function CustomLinkWarningDialog({ handle }: { handle: Dialog.DialogHandle<LinkWarningPayload> }) {
	return <LinkWarningDialogBase handle={handle} />;
}

function LinkWarningDialogBase({ handle }: { handle: Dialog.DialogHandle<LinkWarningPayload> }) {
	return (
		<Dialog.Root handle={handle}>
			{({ payload }: { payload: LinkWarningPayload | undefined }) =>
				payload ? (
					<Dialog.Popup size="narrow">
						<Suspense
							fallback={
								<div className={css.loadingBox}>
									<Spinner color="default" label={m['common.status.loading']()} size="xl" />
								</div>
							}
						>
							<WarningBody close={() => handle.close()} link={payload} />
						</Suspense>
					</Dialog.Popup>
				) : null
			}
		</Dialog.Root>
	);
}
