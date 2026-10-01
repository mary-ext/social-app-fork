import type { ComponentType, ReactNode, SVGProps } from 'react';

import { clsx } from 'clsx';

import { ProgressCircle } from '#/components/ProgressCircle';
import { Spinner } from '#/components/Spinner';
import { Button } from '#/components/web/Button';

import CheckIcon from '#/icons/central/Checkmark2_round_outlined_radius1_stroke2.svg';
import XIcon from '#/icons/central/CrossLarge_round_outlined_radius1_stroke2.svg';
import PlusIcon from '#/icons/central/PlusSmall_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import { keepEditorFocus } from '../focus';
import * as overlay from '../overlay.css';
import * as css from './TileControls.css';
import { getUploadLabel, type PendingUpload } from './upload-status';

/** controls overlay media by default; use `inline` to place them in the tile's layout. */
export type TileVariant = 'inline' | 'overlay';

/**
 * adds or edits an attachment's alt text.
 *
 * @param props alt text state and button controls
 * @returns the button
 */
export function AltButton({
	variant,
	hasAlt,
	tabbable,
	onClick,
}: {
	variant?: TileVariant;
	hasAlt: boolean;
	tabbable: boolean;
	onClick: () => void;
}) {
	return (
		<Button
			label={hasAlt ? m['view.composer.altText.action.edit']() : m['view.composer.altText.action.add']()}
			className={css.altChip({ variant })}
			variant="bare"
			tabIndex={tabbable ? undefined : -1}
			onMouseDown={keepEditorFocus}
			onClick={onClick}
		>
			{hasAlt ? (
				<CheckIcon className={clsx(overlay.overlayIcon, css.altCheck)} />
			) : (
				<PlusIcon className={overlay.overlayIcon} />
			)}
			{hasAlt ? m['view.composer.altText.badge.done']() : m['view.composer.altText.badge.add']()}
		</Button>
	);
}

/**
 * icon button for tile actions.
 *
 * @param props appearance, accessible label, tab order, and click handler
 * @returns the button
 */
export function TileButton({
	variant,
	label,
	icon: Icon,
	tabbable,
	onClick,
}: {
	variant?: TileVariant;
	label: string;
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	tabbable: boolean;
	onClick: () => void;
}) {
	return (
		<Button
			label={label}
			className={css.button({ variant })}
			variant="bare"
			tabIndex={tabbable ? undefined : -1}
			onClick={onClick}
		>
			<Icon className={overlay.overlayIcon} />
		</Button>
	);
}

/**
 * removes an attachment or cancels its upload.
 *
 * @param props upload state and click handler
 * @returns the button
 */
export function RemoveButton({
	variant,
	isUploading,
	onClick,
}: {
	variant?: TileVariant;
	isUploading: boolean;
	onClick: () => void;
}) {
	return (
		<TileButton
			variant={variant}
			label={
				isUploading ? m['view.composer.media.cancelUpload']() : m['view.composer.media.removeAttachment']()
			}
			icon={XIcon}
			// keyboard users remove the tile with Delete or Backspace, so skip this tab stop.
			tabbable={false}
			onClick={onClick}
		/>
	);
}

/**
 * upload progress badge.
 *
 * @param props the pending upload
 * @returns the badge
 */
export function UploadBadge({ variant, upload }: { variant?: TileVariant; upload: PendingUpload }) {
	const onMedia = variant !== 'inline';

	return (
		<div className={css.uploadBadge({ variant })}>
			{upload.status === 'uploading' ? (
				<ProgressCircle
					color={onMedia ? 'white' : colors.primary_500}
					progress={upload.progress}
					size={18}
					trackColor={onMedia ? 'rgba(255, 255, 255, 0.25)' : colors.borderContrastLow}
				/>
			) : (
				<Spinner color={onMedia ? 'white' : 'default'} label={null} size="md" />
			)}
			{getUploadLabel(upload)}
		</div>
	);
}

/**
 * tile actions that preserve editor focus on mouse down.
 *
 * @param props action buttons
 * @returns the row
 */
export function TileActions({ variant, children }: { variant?: TileVariant; children: ReactNode }) {
	return (
		<div className={css.actions({ variant })} onMouseDown={keepEditorFocus}>
			{children}
		</div>
	);
}
