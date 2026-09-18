'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { ComponentType, ReactNode, Ref, SVGProps } from 'react';

import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { clsx } from 'clsx';

import * as styles from '#/components/Dialog/Header.css';
import { Text } from '#/components/Text';
import { Button, ButtonIcon } from '#/components/web/Button';

import ArrowLeftIcon from '#/icons/central/ArrowLeft_round_outlined_radius1_stroke2.svg';
import XIcon from '#/icons/central/CrossLarge_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

/**
 * pinned header for a popup with `scroll="body"`.
 *
 * @param props.children {@link Close} or {@link Back}, then {@link Title} and optional {@link Actions}
 * @param props.border `true` adds a 1px border; `'scrolling'` fades in an overlay divider as `Body`/`List`
 *   scrolls; omitted or `false` leaves no divider
 * @returns the header row
 */
export function Root({ border, children }: { border?: boolean | 'scrolling'; children: ReactNode }) {
	return (
		<div
			className={clsx(
				styles.root,
				border === true && styles.border,
				border === 'scrolling' && styles.scrollingBorder,
			)}
		>
			{children}
		</div>
	);
}

const LeadingButton = ({
	disabled,
	icon,
	label,
	onClick,
	ref,
}: {
	disabled?: boolean;
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	label: string;
	onClick?: () => void;
	ref?: Ref<HTMLButtonElement>;
}) => {
	return (
		<Button
			ref={ref}
			className={styles.leadingButton}
			color="secondary"
			disabled={disabled}
			label={label}
			onClick={onClick}
			shape="round"
			size="small"
			variant="ghost"
		>
			<ButtonIcon icon={icon} />
		</Button>
	);
};

/**
 * closes the dialog unless `onClick` is provided.
 *
 * @param props.disabled disables only this button, not other dismissal methods
 * @param props.onClick replaces dismissal, for example to confirm unsaved changes
 * @param props.ref the button ref
 * @returns the close button
 */
export function Close({
	disabled,
	onClick,
	ref,
}: {
	disabled?: boolean;
	onClick?: () => void;
	ref?: Ref<HTMLButtonElement>;
}) {
	const button = (
		<LeadingButton
			ref={ref}
			disabled={disabled}
			icon={XIcon}
			label={m['common.a11y.closeDialog']()}
			onClick={onClick}
		/>
	);

	if (onClick) {
		return button;
	}

	return <BaseDialog.Close render={button} />;
}

/**
 * back button for a multi-step dialog header.
 *
 * @param props.onClick returns to the previous step
 * @param props.ref the button ref
 * @returns the back button
 */
export function Back({ onClick, ref }: { onClick: () => void; ref?: Ref<HTMLButtonElement> }) {
	return <LeadingButton ref={ref} icon={ArrowLeftIcon} label={m['common.action.back']()} onClick={onClick} />;
}

/**
 * accessible dialog heading, truncated to one line.
 *
 * @param props.children heading text
 * @returns the heading
 */
export function Title({ children }: { children: ReactNode }) {
	return (
		<BaseDialog.Title
			className={styles.title}
			render={<Text numberOfLines={1} size="lg" weight="semiBold" />}
		>
			{children}
		</BaseDialog.Title>
	);
}

/**
 * right-aligned header actions.
 *
 * @param props.children action controls, typically small buttons
 * @returns the action row
 */
export function Actions({ children }: { children: ReactNode }) {
	return <div className={styles.actions}>{children}</div>;
}
