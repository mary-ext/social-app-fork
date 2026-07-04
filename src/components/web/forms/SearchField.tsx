import type { ComponentPropsWithRef, ReactNode } from 'react';

import { clsx } from 'clsx';

import { MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlassIcon } from '#/components/icons/MagnifyingGlass';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Button, ButtonIcon } from '#/components/web/Button';
import * as styles from '#/components/web/forms/SearchField.css';

/**
 * search-field chrome: a container overlaying a leading {@link Icon} and trailing {@link Clear} on the
 * {@link Input}.
 */
export function Root({ children, className }: { children: ReactNode; className?: string }) {
	return <div className={clsx(styles.field, className)}>{children}</div>;
}

/** leading, non-interactive magnifying-glass icon. */
export function Icon() {
	return <MagnifyingGlassIcon className={styles.icon} size="lg" fill="currentColor" />;
}

/**
 * the styled field input. render it directly, or via a Base UI input's `render` prop to inherit the shared
 * styling.
 */
export function Input({ className, ...props }: ComponentPropsWithRef<'input'>) {
	return <input type="text" {...props} className={clsx(styles.input, className)} />;
}

/**
 * trailing clear button (×); out of the tab order since keyboard users clear by editing.
 *
 * @param label accessible name
 */
export function Clear({ label, onClick }: { label: string; onClick: () => void }) {
	return (
		<Button
			className={styles.clear}
			color="secondary"
			label={label}
			onClick={onClick}
			shape="round"
			size="tiny"
			tabIndex={-1}
			variant="ghost"
		>
			<ButtonIcon icon={XIcon} size="xs" />
		</Button>
	);
}
