import { useImperativeHandle, useRef, useState } from 'react';

import { Cropper, type CropperConfig, type CropValue } from '@oomfware/cropper';

import { clsx } from 'clsx';

import {
	type ImageCrop,
	type ImageSource,
	type ImageTransformation,
	manipulateImage,
} from '#/lib/media/composer-image';
import { getBlobUrl } from '#/lib/utils/blob-url';

import * as Dialog from '#/components/Dialog';
import { Spinner } from '#/components/Spinner';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import { type AspectRatio, AspectRatioSelect, CropToolbar } from './CropToolbar';
import type { EditImageDialogProps } from './EditImageDialog';
import * as styles from './EditImageDialogInner.css';

const CROPPER_CONFIG: Partial<CropperConfig> = {
	insets: { top: 16, right: 16, bottom: 16, left: 16 },
};

export function EditImageDialogInner({
	handle,
	image,
	onChange,
	circularCrop,
	aspectRatio,
}: EditImageDialogProps) {
	const [pending, setPending] = useState(false);
	const ref = useRef<{ save: () => Promise<void> }>(null);

	const onPressSave = async () => {
		setPending(true);
		await ref.current?.save();
		setPending(false);
	};

	return (
		<>
			<Dialog.Header.Outer>
				<Dialog.Header.Slot>
					<Button
						color="primary"
						disabled={pending}
						label={m['common.action.cancel']()}
						onClick={() => handle.close()}
						size="small"
						variant="ghost"
					>
						<ButtonText size="md">{m['common.action.cancel']()}</ButtonText>
					</Button>
				</Dialog.Header.Slot>
				<Dialog.Header.Content>
					<Dialog.Header.TitleText>{m['view.composer.gallery.action.edit']()}</Dialog.Header.TitleText>
				</Dialog.Header.Content>
				<Dialog.Header.Slot>
					<Button
						color="primary"
						disabled={pending}
						label={m['common.action.save']()}
						onClick={() => void onPressSave()}
						size="small"
						variant="ghost"
					>
						<ButtonText size="md">{m['common.action.save']()}</ButtonText>
						{pending && <Spinner color="default" label={m['common.status.saving']()} size="sm" />}
					</Button>
				</Dialog.Header.Slot>
			</Dialog.Header.Outer>

			{image && (
				<EditImageInner
					aspectRatio={aspectRatio}
					circularCrop={circularCrop}
					handle={handle}
					image={image}
					key={image.source.id}
					onChange={onChange}
					saveRef={ref}
				/>
			)}
		</>
	);
}

function EditImageInner({
	image,
	onChange,
	saveRef,
	handle,
	circularCrop = false,
	aspectRatio,
}: Required<Pick<EditImageDialogProps, 'image'>> &
	Omit<EditImageDialogProps, 'image'> & {
		saveRef: React.RefObject<{ save: () => Promise<void> } | null>;
	}) {
	const source = image.source;
	const sourceUrl = getBlobUrl(source.blob);

	const ratioIsFixed = aspectRatio !== undefined;
	const initialCrop = getInitialCrop(image.manips);
	const [ratio, setRatio] = useState<AspectRatio>(() => aspectRatio ?? image.manips?.ratio ?? null);

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
				const result = await manipulateImage(image, { crop, ratio });

				onChange(result);
				handle.close();
			},
		}),
		[ratio, image, source, handle, onChange],
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

const toImageCrop = (value: CropValue, source: ImageSource): ImageCrop | undefined => {
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
