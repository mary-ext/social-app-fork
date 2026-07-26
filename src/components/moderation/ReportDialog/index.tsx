import { lazy, Suspense } from 'react';

import * as Dialog from '#/components/Dialog';
import { reportDialogHandle } from '#/components/dialogs/handles';
import { Spinner } from '#/components/Spinner';

import { m } from '#/paraglide/messages';

import * as styles from './index.css';
import type { ReportSubject } from './types';

const Content = lazy(() => import('./ReportDialogContent').then((mod) => ({ default: mod.Content })));

function ContentFallback() {
	return (
		<div className={styles.loadingFallback}>
			<Spinner color="default" label={m['common.status.loading']()} size="xl" />
		</div>
	);
}

/** the app-wide report dialog. */
export function GlobalReportDialog() {
	return (
		<Dialog.Root handle={reportDialogHandle}>
			{({ payload }: { payload: { subject: ReportSubject } | undefined }) =>
				payload ? (
					<Dialog.Popup className={styles.popup} scroll="body">
						<Suspense fallback={<ContentFallback />}>
							<Content close={() => reportDialogHandle.close()} subject={payload.subject} />
						</Suspense>
					</Dialog.Popup>
				) : null
			}
		</Dialog.Root>
	);
}

export function ReportDialog({
	handle,
	onAfterSubmit,
	onClose,
	subject,
}: {
	handle: Dialog.DialogHandle;
	onAfterSubmit?: () => void;
	onClose?: () => void;
	subject?: ReportSubject;
}) {
	return (
		<Dialog.Root
			handle={handle}
			onOpenChange={(open) => {
				if (!open) {
					onClose?.();
				}
			}}
		>
			<Dialog.Popup className={styles.popup} scroll="body">
				<Suspense fallback={<ContentFallback />}>
					<Content close={() => handle.close()} onAfterSubmit={onAfterSubmit} subject={subject} />
				</Suspense>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
