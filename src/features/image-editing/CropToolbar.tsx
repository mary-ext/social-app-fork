import type { ComponentType, ReactNode, SVGProps } from 'react';

import { useCropper, useZoomControl } from '@oomfware/cropper';

import { Slider } from '@base-ui/react/slider';

import { LOCALE } from '#/locale/intl/locale';

import * as Select from '#/components/Select';
import { Button, ButtonIcon } from '#/components/web/Button';

import RotateRightIcon from '#/icons/central/ArrowRotateClockwise_round_outlined_radius1_stroke2.svg';
import RotateLeftIcon from '#/icons/central/ArrowRotateCounterClockwise_round_outlined_radius1_stroke2.svg';
import CropIcon from '#/icons/central/Crop_round_outlined_radius1_stroke2.svg';
import ZoomInIcon from '#/icons/central/ZoomIn_round_outlined_radius1_stroke2.svg';
import ZoomOutIcon from '#/icons/central/ZoomOut_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as styles from './CropToolbar.css';

export type AspectRatio = number | null;

const RATIO_PRESETS = [
	{ width: 9, height: 16 },
	{ width: 2, height: 3 },
	{ width: 3, height: 4 },
	{ width: 4, height: 5 },
	{ width: 1, height: 1 },
	{ width: 5, height: 4 },
	{ width: 4, height: 3 },
	{ width: 3, height: 2 },
	{ width: 16, height: 9 },
];

export function AspectRatioSelect({
	value,
	onValueChange,
}: {
	value: AspectRatio;
	onValueChange: (value: AspectRatio) => void;
}) {
	const items: Select.SelectItem<AspectRatio>[] = [
		{ label: m['components.editImageDialog.aspectRatio.original'](), value: null },
		...RATIO_PRESETS.map((preset) => ({
			label: `${preset.width}:${preset.height}`,
			value: preset.width / preset.height,
		})),
	];

	return (
		<Select.Root items={items} value={value} onValueChange={onValueChange}>
			<Select.Trigger
				render={
					<Button
						className={styles.ratioTrigger}
						color="secondary"
						label={m['components.editImageDialog.aspectRatio.label']()}
						shape="rectangular"
						size="small"
						variant="solid"
					/>
				}
			>
				<ButtonIcon icon={CropIcon} size="sm" />
				<Select.Value />
				<Select.Icon />
			</Select.Trigger>
			<Select.Content
				align="start"
				items={items}
				matchTriggerWidth={false}
				renderItem={(item) => (
					<Select.Item value={item.value} label={item.label}>
						<Select.ItemIndicator />
						<Select.ItemText>{item.label}</Select.ItemText>
					</Select.Item>
				)}
			/>
		</Select.Root>
	);
}

const ZOOM_STEP = 0.1;

const percent = new Intl.NumberFormat(LOCALE, { style: 'percent' });

export function CropToolbar({ children }: { children?: ReactNode }) {
	const { rotate } = useCropper();

	return (
		<div className={styles.toolbar}>
			{children}

			<div className={styles.group}>
				<ToolbarButton
					icon={RotateLeftIcon}
					label={m['components.editImageDialog.rotate.left']()}
					onClick={() => rotate(-1)}
				/>
				<ToolbarButton
					icon={RotateRightIcon}
					label={m['components.editImageDialog.rotate.right']()}
					onClick={() => rotate(1)}
				/>
			</div>
			<ZoomSlider />
		</div>
	);
}

function ToolbarButton({
	icon,
	label,
	onClick,
	disabled,
}: {
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	label: string;
	onClick: () => void;
	disabled?: boolean;
}) {
	return (
		<Button
			color="secondary"
			disabled={disabled}
			label={label}
			onClick={onClick}
			shape="round"
			variant="ghost"
		>
			<ButtonIcon icon={icon} size="lg" />
		</Button>
	);
}

function ZoomSlider() {
	const { disabled, fraction, setFraction, zoom } = useZoomControl();

	return (
		<div className={styles.zoomGroup}>
			<ToolbarButton
				disabled={disabled}
				icon={ZoomOutIcon}
				label={m['components.editImageDialog.zoom.out']()}
				onClick={() => setFraction(fraction - ZOOM_STEP)}
			/>

			<Slider.Root
				className={styles.slider}
				disabled={disabled}
				min={0}
				max={1}
				step={0.01}
				largeStep={ZOOM_STEP}
				value={fraction}
				onValueChange={setFraction}
			>
				<Slider.Control className={styles.sliderControl}>
					<Slider.Track className={styles.sliderTrack}>
						<Slider.Indicator className={styles.sliderIndicator} />
						<Slider.Thumb
							className={styles.sliderThumb}
							aria-label={m['components.editImageDialog.zoom.label']()}
							getAriaValueText={() => percent.format(zoom)}
						/>
					</Slider.Track>
				</Slider.Control>
			</Slider.Root>

			<ToolbarButton
				disabled={disabled}
				icon={ZoomInIcon}
				label={m['components.editImageDialog.zoom.in']()}
				onClick={() => setFraction(fraction + ZOOM_STEP)}
			/>
		</div>
	);
}
