import { lazy, Suspense } from 'react';

import type { ComposerImage } from '#/state/gallery';

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

// react-image-crop (plus its stylesheet) is a sizable dependency only needed once someone actually crops
// an image, so the cropper body loads on first open rather than riding along in every composer/profile-edit
// chunk that mounts this dialog.
const EditImageDialogInner = lazy(() =>
	import('./EditImageDialogInner').then((mod) => ({ default: mod.EditImageDialogInner })),
);

export function EditImageDialog(props: EditImageDialogProps) {
	return (
		<Dialog.Root disablePointerDismissal handle={props.handle}>
			<Dialog.Popup scroll="body">
				<Suspense
					fallback={
						<Dialog.Body>
							<div className={styles.loadingHeader} />
							<div className={styles.loadingBody}>
								<Spinner color="default" label={m['common.status.loading']()} />
							</div>
						</Dialog.Body>
					}
				>
					<EditImageDialogInner {...props} />
				</Suspense>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
