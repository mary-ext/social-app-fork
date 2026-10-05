import type { ComponentType, ReactNode, SVGProps } from 'react';

import { clsx } from 'clsx';

import { ProgressCircle } from '#/components/ProgressCircle';
import { Spinner } from '#/components/Spinner';
import { Button } from '#/components/web/Button';

import CheckIcon from '#/icons/central/Checkmark2_round_outlined_radius1_stroke2.svg';
import XIcon from '#/icons/central/CrossLarge_round_outlined_radius1_stroke2.svg';
import WarningIcon from '#/icons/central/ExclamationTriangle_round_outlined_radius1_stroke2.svg';
import PlusIcon from '#/icons/central/PlusSmall_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import { useComposer } from '../../context';
import { keepEditorFocus } from '../../shared/editor-focus';
import { getUploadLabel } from '../uploads/upload-status';
import { isPendingUpload, type PendingUpload, type VideoUploadState } from '../uploads/video-uploads';
import * as css from './TileControls.css';

/**
 * controls overlay media by default; `inline` places them in the tile's layout. overlay badges require
 * {@link TileBadges}.
 */
export type TileVariant = 'inline' | 'overlay';

/**
 * groups overlay badges at the tile's bottom-left corner.
 *
 * @param props the badges
 * @returns the row
 */
export function TileBadges({ children }: { children: ReactNode }) {
	return <div className={css.badges}>{children}</div>;
}

const ChipButton = ({
	variant,
	icon,
	label,
	text,
	tabbable,
	onClick,
}: {
	variant?: TileVariant;
	icon: ReactNode;
	label: string;
	text: string;
	tabbable: boolean;
	onClick: () => void;
}) => {
	return (
		<Button
			label={label}
			className={css.chip({ variant })}
			variant="bare"
			tabIndex={tabbable ? undefined : -1}
			onMouseDown={keepEditorFocus}
			onClick={onClick}
		>
			{icon}
			{text}
		</Button>
	);
};

const toggleIcon = (isDone: boolean) => {
	return isDone ? <CheckIcon className={clsx(css.icon, css.chipCheck)} /> : <PlusIcon className={css.icon} />;
};

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
		<ChipButton
			variant={variant}
			icon={toggleIcon(hasAlt)}
			label={
				hasAlt ? m['features.composer.altText.action.edit']() : m['features.composer.altText.action.add']()
			}
			text={hasAlt ? m['features.composer.altText.badge.done']() : m['features.composer.altText.badge.add']()}
			tabbable={tabbable}
			onClick={onClick}
		/>
	);
}

/**
 * adds or edits a video's caption files.
 *
 * @param props captions state and button controls
 * @returns the button
 */
export function CaptionsButton({
	hasCaptions,
	tabbable,
	onClick,
}: {
	hasCaptions: boolean;
	tabbable: boolean;
	onClick: () => void;
}) {
	return (
		<ChipButton
			icon={toggleIcon(hasCaptions)}
			label={
				hasCaptions
					? m['features.composer.captions.action.edit']()
					: m['features.composer.captions.action.add']()
			}
			text={
				hasCaptions
					? m['features.composer.captions.badge.done']()
					: m['features.composer.captions.action.add']()
			}
			tabbable={tabbable}
			onClick={onClick}
		/>
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
			<Icon className={css.icon} />
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
				isUploading
					? m['features.composer.media.action.cancelUpload']()
					: m['features.composer.media.action.remove']()
			}
			icon={XIcon}
			// keyboard users remove the tile with Delete or Backspace, so skip this tab stop.
			tabbable={false}
			onClick={onClick}
		/>
	);
}

const UploadBadge = ({ variant, upload }: { variant?: TileVariant; upload: PendingUpload }) => {
	const onMedia = variant !== 'inline';

	return (
		<div className={css.uploadBadge({ variant })}>
			{upload.status === 'uploading' ? (
				<ProgressCircle
					color={onMedia ? 'white' : colors.primary_500}
					progress={upload.sent}
					size={18}
					trackColor={onMedia ? 'rgba(255, 255, 255, 0.25)' : colors.borderContrastLow}
				/>
			) : (
				<Spinner color={onMedia ? 'white' : 'default'} label={null} size="md" />
			)}
			{getUploadLabel(upload)}
		</div>
	);
};

/**
 * shows upload progress or a retry button.
 *
 * @param props upload, layout, focus order, and fallback content
 * @returns status while pending or failed; otherwise `children`
 */
export function TileUploadStatus({
	variant,
	file,
	upload,
	tabbable,
	children,
}: {
	variant?: TileVariant;
	file: File;
	upload: VideoUploadState | undefined;
	tabbable: boolean;
	children?: ReactNode;
}) {
	const { uploads } = useComposer();

	let status: ReactNode;
	if (isPendingUpload(upload)) {
		status = <UploadBadge variant={variant} upload={upload} />;
	} else if (upload?.status === 'failed') {
		status = (
			<ChipButton
				variant={variant}
				icon={<WarningIcon className={clsx(css.icon, css.chipWarning)} />}
				label={m['features.composer.media.action.retryUpload']()}
				text={m['common.action.retry']()}
				tabbable={tabbable}
				onClick={() => uploads.retry(file)}
			/>
		);
	} else {
		return children;
	}

	return variant === 'inline' ? status : <div className={css.status}>{status}</div>;
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
