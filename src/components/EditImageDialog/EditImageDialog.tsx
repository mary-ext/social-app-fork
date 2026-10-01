import { lazy, Suspense } from 'react';

import type { ComposerImage } from '#/lib/media/composer-image';

import * as Dialog from '#/components/Dialog';
import { Spinner } from '#/components/Spinner';

import { m } from '#/paraglide/messages';

import * as styles from './EditImageDialog.css';

export type EditImageDialogProps = {
	handle: Dialog.DialogHandle;
	image?: ComposerImage;
	onChange: (next: ComposerImage) => void;
	aspectRatio?: number;
	circularCrop?: boolean;
};

const EditImageDialogInner = lazy(() =>
	import('./EditImageDialogInner').then((mod) => ({ default: mod.EditImageDialogInner })),
);

export function EditImageDialog(props: EditImageDialogProps) {
	return (
		<Dialog.Root disablePointerDismissal handle={props.handle}>
			<Dialog.Popup scroll="body">
				<Suspense
					fallback={
						<>
							<Dialog.Header.Root border>
								<Dialog.Header.Close />
								<Dialog.Header.Title>{m['view.composer.gallery.action.edit']()}</Dialog.Header.Title>
							</Dialog.Header.Root>
							<Dialog.Body>
								<div className={styles.loadingBody}>
									<Spinner color="default" label={m['common.status.loading']()} />
								</div>
							</Dialog.Body>
						</>
					}
				>
					<EditImageDialogInner {...props} />
				</Suspense>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
