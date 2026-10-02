import { lazy, type ReactNode, Suspense } from 'react';

import type { ImageMeta, ImageTransformation } from '#/lib/media/composer-image';

import * as Dialog from '#/components/Dialog';
import { Spinner } from '#/components/Spinner';

import { m } from '#/paraglide/messages';

import * as styles from './EditImageDialog.css';

export type EditImageTarget = {
	/** uncropped source image. */
	source: ImageMeta;
	/** saved crop, rotation, and aspect ratio to restore on open. */
	manips?: ImageTransformation;
};

export type EditedImage = {
	/** cropped PNG and its dimensions. */
	transformed: ImageMeta;
	/** settings for reopening the editor with this edit. */
	manips: ImageTransformation;
};

const EditImageDialogInner = lazy(() =>
	import('./EditImageDialogInner').then((mod) => ({ default: mod.EditImageDialogInner })),
);

/**
 * image crop dialog.
 *
 * @param props.handle dialog handle carrying the source image and saved settings
 * @param props.onSave receives the crop result (null to clear an edit) and the opening payload
 * @param props.aspectRatio fixed width-to-height ratio; hides the ratio picker
 * @param props.circularCrop circular preview; output remains rectangular
 * @returns the dialog
 */
export const EditImageDialog = <T extends EditImageTarget>({
	handle,
	onSave,
	aspectRatio,
	circularCrop = false,
}: {
	handle: Dialog.DialogHandle<T>;
	onSave: (edited: EditedImage | null, target: T) => void;
	aspectRatio?: number;
	circularCrop?: boolean;
}): ReactNode => {
	return (
		<Dialog.Root disablePointerDismissal handle={handle}>
			{({ payload }) => (
				<Dialog.Popup scroll="body" label={m['view.composer.gallery.action.edit']()}>
					<Suspense
						fallback={
							<Dialog.Body>
								<div className={styles.loadingBody}>
									<Spinner color="default" label={m['common.status.loading']()} />
								</div>
							</Dialog.Body>
						}
					>
						{payload && (
							<EditImageDialogInner
								aspectRatio={aspectRatio}
								circularCrop={circularCrop}
								target={payload}
								onSave={(edited) => {
									onSave(edited, payload);
									handle.close();
								}}
							/>
						)}
					</Suspense>
				</Dialog.Popup>
			)}
		</Dialog.Root>
	);
};
