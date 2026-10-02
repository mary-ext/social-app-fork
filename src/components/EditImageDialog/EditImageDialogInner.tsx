import { type RefObject, useImperativeHandle, useRef, useState } from 'react';

import { Cropper, type CropperConfig, type CropValue } from '@oomfware/cropper';

import { clsx } from 'clsx';

import {
	cropImage,
	type ImageCrop,
	type ImageMeta,
	type ImageTransformation,
} from '#/lib/media/composer-image';
import { getBlobUrl } from '#/lib/utils/blob-url';

import * as Dialog from '#/components/Dialog';
import { Button, ButtonSpinner, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import { type AspectRatio, AspectRatioSelect, CropToolbar } from './CropToolbar';
import type { EditedImage, EditImageTarget } from './EditImageDialog';
import * as styles from './EditImageDialogInner.css';

const CROPPER_CONFIG: Partial<CropperConfig> = {
	insets: { top: 16, right: 16, bottom: 16, left: 16 },
};

type EditImageDialogInnerProps = {
	target: EditImageTarget;
	onSave: (edited: EditedImage | null) => void;
	aspectRatio: number | undefined;
	circularCrop: boolean;
};

export function EditImageDialogInner({
	target,
	onSave,
	aspectRatio,
	circularCrop,
}: EditImageDialogInnerProps) {
	const [pending, setPending] = useState(false);
	const ref = useRef<{ save: () => Promise<void> }>(null);

	const onPressSave = async () => {
		setPending(true);
		await ref.current?.save();
		setPending(false);
	};

	return (
		<>
			<Dialog.Header.Root border>
				<Dialog.Header.Close disabled={pending} />
				<Dialog.Header.Title>{m['view.composer.gallery.action.edit']()}</Dialog.Header.Title>
				<Dialog.Header.Actions>
					<Button
						color="primary"
						disabled={pending}
						label={m['common.action.save']()}
						onClick={() => void onPressSave()}
						size="small"
					>
						<ButtonText>{m['common.action.save']()}</ButtonText>
						{pending && <ButtonSpinner color="white" label={m['common.status.saving']()} />}
					</Button>
				</Dialog.Header.Actions>
			</Dialog.Header.Root>

			<EditImageInner
				aspectRatio={aspectRatio}
				circularCrop={circularCrop}
				onSave={onSave}
				saveRef={ref}
				target={target}
			/>
		</>
	);
}

function EditImageInner({
	target,
	onSave,
	saveRef,
	circularCrop,
	aspectRatio,
}: EditImageDialogInnerProps & {
	saveRef: RefObject<{ save: () => Promise<void> } | null>;
}) {
	const { source, manips } = target;
	const sourceUrl = getBlobUrl(source.blob);

	const ratioIsFixed = aspectRatio !== undefined;
	const initialCrop = getInitialCrop(manips);
	const [ratio, setRatio] = useState<AspectRatio>(() => aspectRatio ?? manips?.ratio ?? null);

	const cropRef = useRef(initialCrop);
	const sourceDimensions =
		source.width > 0 && source.height > 0
			? {
					height: source.height,
					width: source.width,
				}
			: undefined;

	useImperativeHandle(
		saveRef,
		() => ({
			async save() {
				const crop = cropRef.current && toImageCrop(cropRef.current, source);
				if (!crop) {
					onSave(null);
					return;
				}

				onSave({ transformed: await cropImage(source.blob, crop), manips: { crop, ratio } });
			},
		}),
		[ratio, source, onSave],
	);

	return (
		<Cropper.Root
			aspectRatio={ratio ?? undefined}
			config={CROPPER_CONFIG}
			defaultValue={initialCrop}
			onValueChange={(value) => {
				cropRef.current = value;
			}}
		>
			<Dialog.Body className={styles.body}>
				<Cropper.Viewport className={styles.viewport}>
					<Cropper.Image alt="" src={sourceUrl} {...sourceDimensions} />
					<Cropper.Window className={clsx(styles.cropWindow, circularCrop && styles.roundCropWindow)}>
						<div className={styles.grid} />
					</Cropper.Window>
				</Cropper.Viewport>
			</Dialog.Body>
			<Dialog.Footer>
				<CropToolbar>
					{!ratioIsFixed && <AspectRatioSelect value={ratio} onValueChange={setRatio} />}
				</CropToolbar>
			</Dialog.Footer>
		</Cropper.Root>
	);
}

const getInitialCrop = (manips: ImageTransformation | undefined): CropValue | undefined => {
	const crop = manips?.crop;
	if (!crop) {
		return undefined;
	}

	return {
		rotation: crop.rotation,
		x: crop.originX,
		y: crop.originY,
		width: crop.width,
		height: crop.height,
	};
};

const toImageCrop = (value: CropValue, source: ImageMeta): ImageCrop | undefined => {
	const originX = Math.round(value.x);
	const originY = Math.round(value.y);
	const width = Math.round(value.x + value.width) - originX;
	const height = Math.round(value.y + value.height) - originY;

	if (width === 0 || height === 0) {
		return undefined;
	}

	if (value.rotation === 0 && width === source.width && height === source.height) {
		return undefined;
	}

	return { rotation: value.rotation, height, originX, originY, width };
};
