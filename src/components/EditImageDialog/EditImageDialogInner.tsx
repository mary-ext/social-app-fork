import 'react-image-crop/dist/ReactCrop.css';

import { type CSSProperties, useImperativeHandle, useRef, useState } from 'react';

import { ReactCrop, type PercentCrop } from 'react-image-crop';

import { useBlobUrl } from '#/lib/hooks/useBlobUrl';

import { type ImageSource, type ImageTransformation, manipulateImage } from '#/state/gallery';

import * as Dialog from '#/components/Dialog';
import { Spinner } from '#/components/Spinner';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import type { EditImageDialogProps } from './EditImageDialog';
import * as styles from './EditImageDialogInner.css';

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

			<Dialog.Body>
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
			</Dialog.Body>
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
	const sourceUrl = useBlobUrl(source.blob);

	const initialCrop = getInitialCrop(source, image.manips);
	const [crop, setCrop] = useState(initialCrop);
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
			save: async () => {
				const result = await manipulateImage(image, {
					crop:
						crop && (crop.width || crop.height) !== 0
							? {
									originX: (crop.x * source.width) / 100,
									originY: (crop.y * source.height) / 100,
									width: (crop.width * source.width) / 100,
									height: (crop.height * source.height) / 100,
								}
							: undefined,
				});

				onChange(result);
				handle.close();
			},
		}),
		[crop, image, source, handle, onChange],
	);

	return (
		<div className={styles.imageBox}>
			<div className={styles.cropArea}>
				<ReactCrop
					aspect={aspectRatio}
					circularCrop={circularCrop}
					className="ReactCrop--no-animate"
					crop={crop}
					onChange={(_pixelCrop, percentCrop) => setCrop(percentCrop)}
				>
					<img alt="" src={sourceUrl} {...sourceDimensions} style={imageStyle} />
				</ReactCrop>
			</div>
		</div>
	);
}

// cap the image to the square frame (the `cropArea` query container), so the cropper hugs the image rather
// than letting the crop overlay extend into the letterbox. `width`/`height: auto` override the intrinsic-size
// attributes (spread from `sourceDimensions`) so the two `max-*` constraints preserve aspect ratio instead of
// clamping each axis independently into a square
const imageStyle = {
	display: 'block',
	height: 'auto',
	maxHeight: '100cqh',
	maxWidth: '100cqw',
	width: 'auto',
} satisfies CSSProperties;

const getInitialCrop = (
	source: ImageSource,
	manips: ImageTransformation | undefined,
): PercentCrop | undefined => {
	const initialArea = manips?.crop;

	if (initialArea) {
		return {
			unit: '%',
			x: (initialArea.originX / source.width) * 100,
			y: (initialArea.originY / source.height) * 100,
			width: (initialArea.width / source.width) * 100,
			height: (initialArea.height / source.height) * 100,
		};
	}
};
