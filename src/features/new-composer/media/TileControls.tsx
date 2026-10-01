import type { ReactNode } from 'react';

import { clsx } from 'clsx';

import { ProgressCircle } from '#/components/ProgressCircle';
import { Spinner } from '#/components/Spinner';
import { Button } from '#/components/web/Button';

import CheckIcon from '#/icons/central/Checkmark2_round_outlined_radius1_stroke2.svg';
import XIcon from '#/icons/central/CrossLarge_round_outlined_radius1_stroke2.svg';
import PlusIcon from '#/icons/central/PlusSmall_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { keepEditorFocus } from '../focus';
import * as overlay from '../overlay.css';
import * as css from './TileControls.css';
import { getUploadLabel, type PendingUpload } from './upload-status';

/**
 * adds or edits an attachment's alt text.
 *
 * @param props alt text state and button controls
 * @returns the button
 */
export function AltButton({
	className,
	hasAlt,
	tabbable,
	onClick,
}: {
	className: string;
	hasAlt: boolean;
	tabbable: boolean;
	onClick: () => void;
}) {
	return (
		<Button
			label={hasAlt ? m['view.composer.altText.action.edit']() : m['view.composer.altText.action.add']()}
			className={className}
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
 * removes an attachment or cancels its upload.
 *
 * @param props styling, upload state, and click handler
 * @returns the button
 */
export function RemoveButton({
	className,
	isUploading,
	onClick,
}: {
	className: string;
	isUploading: boolean;
	onClick: () => void;
}) {
	return (
		<Button
			label={
				isUploading ? m['view.composer.media.cancelUpload']() : m['view.composer.media.removeAttachment']()
			}
			className={className}
			variant="bare"
			// keyboard users remove the tile with Delete or Backspace, so skip this tab stop.
			tabIndex={-1}
			onClick={onClick}
		>
			<XIcon className={overlay.overlayIcon} />
		</Button>
	);
}

/**
 * upload progress overlay.
 *
 * @param props the pending upload
 * @returns the badge
 */
export function OverlayUploadBadge({ upload }: { upload: PendingUpload }) {
	return (
		<div className={css.overlayUploadBadge}>
			{upload.status === 'uploading' ? (
				<ProgressCircle
					color="white"
					progress={upload.progress}
					size={18}
					trackColor="rgba(255, 255, 255, 0.25)"
				/>
			) : (
				<Spinner color="white" label={null} size="md" />
			)}
			{getUploadLabel(upload)}
		</div>
	);
}

/**
 * tile actions that preserve editor focus on mouse down.
 *
 * @param props class name and action buttons
 * @returns the row
 */
export function TileActions({ className, children }: { className: string; children: ReactNode }) {
	return (
		<div className={className} onMouseDown={keepEditorFocus}>
			{children}
		</div>
	);
}
