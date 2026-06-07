import 'react-image-crop/dist/ReactCrop.css';

import { type CSSProperties, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { View } from 'react-native';
import { Trans, useLingui } from '@lingui/react/macro';
import ReactCrop, { type PercentCrop } from 'react-image-crop';

import { useBlobUrl } from '#/lib/hooks/useBlobUrl';

import {
	type ComposerImage,
	type ImageSource,
	type ImageTransformation,
	manipulateImage,
} from '#/state/gallery';

import { atoms as a, useTheme } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { Loader } from '#/components/Loader';
import * as Sheet from '#/components/web/Sheet';

export type EditImageDialogProps = {
	handle: Sheet.SheetHandle;
	image?: ComposerImage;
	onChange: (next: ComposerImage) => void;
	aspectRatio?: number;
	circularCrop?: boolean;
};

export function EditImageDialog(props: EditImageDialogProps) {
	const { t: l } = useLingui();
	return (
		<Sheet.Root handle={props.handle}>
			<Sheet.Popup label={l`Edit image`}>
				<DialogInner {...props} />
			</Sheet.Popup>
		</Sheet.Root>
	);
}

function DialogInner({ handle, image, onChange, circularCrop, aspectRatio }: EditImageDialogProps) {
	const { t: l } = useLingui();
	const [pending, setPending] = useState(false);
	const ref = useRef<{ save: () => Promise<void> }>(null);

	return (
		<>
			<Sheet.Header.Outer>
				<Sheet.Header.Slot>
					<Button
						label={l`Cancel`}
						disabled={pending}
						onPress={() => handle.close()}
						size="small"
						color="primary"
						variant="ghost"
						style={[a.rounded_full]}
						testID="cropImageCancelBtn"
					>
						<ButtonText style={[a.text_md]}>
							<Trans>Cancel</Trans>
						</ButtonText>
					</Button>
				</Sheet.Header.Slot>
				<Sheet.Header.Content>
					<Sheet.Header.TitleText>
						<Trans>Edit image</Trans>
					</Sheet.Header.TitleText>
				</Sheet.Header.Content>
				<Sheet.Header.Slot>
					<Button
						label={l`Save`}
						onPress={async () => {
							setPending(true);
							await ref.current?.save();
							setPending(false);
						}}
						disabled={pending}
						size="small"
						color="primary"
						variant="ghost"
						style={[a.rounded_full]}
						testID="cropImageSaveBtn"
					>
						<ButtonText style={[a.text_md]}>
							<Trans>Save</Trans>
						</ButtonText>
						{pending && <ButtonIcon icon={Loader} />}
					</Button>
				</Sheet.Header.Slot>
			</Sheet.Header.Outer>

			<Sheet.Body>
				<View style={[a.p_xl]}>
					{image && (
						<EditImageInner
							saveRef={ref}
							handle={handle}
							key={image.source.id}
							image={image}
							onChange={onChange}
							circularCrop={circularCrop}
							aspectRatio={aspectRatio}
						/>
					)}
				</View>
			</Sheet.Body>
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
	const t = useTheme();
	const [isDragging, setIsDragging] = useState(false);

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

	const onPressSubmit = useCallback(async () => {
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
	}, [crop, image, source, handle, onChange]);

	useImperativeHandle(
		saveRef,
		() => ({
			save: onPressSubmit,
		}),
		[onPressSubmit],
	);

	return (
		<View
			style={[
				a.mx_auto,
				a.border,
				t.atoms.border_contrast_low,
				a.rounded_xs,
				a.overflow_hidden,
				a.align_center,
			]}
		>
			<ReactCrop
				crop={crop}
				aspect={aspectRatio}
				circularCrop={circularCrop}
				onChange={(_pixelCrop, percentCrop) => setCrop(percentCrop)}
				className="ReactCrop--no-animate"
				onDragStart={() => setIsDragging(true)}
				onDragEnd={() => setIsDragging(false)}
			>
				<img alt="" src={sourceUrl} {...sourceDimensions} style={imageStyle} />
			</ReactCrop>
			{/* Eat clicks when dragging, otherwise mousing up over the backdrop
        causes the dialog to close */}
			{isDragging && <View style={[a.fixed, a.inset_0]} />}
		</View>
	);
}

const imageStyle = {
	display: 'block',
	height: 'auto',
	maxHeight: '50vh',
	maxWidth: '100%',
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
