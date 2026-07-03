import { clsx } from 'clsx';

import type { Props as IconProps } from '#/components/icons/common';
import { Loader_Stroke2_Corner0_Rounded as LoaderIcon } from '#/components/icons/Loader';

import * as styles from './Spinner.css';

type SpinnerProps = {
	className?: string;
	/** Tint applied to the spinner. */
	color?: 'white' | 'default';
	/** Accessible label announced by the `progressbar` role (e.g. "Loading GIF"). */
	label: string | null;
	/** Icon size token; defaults to `3xl`. */
	size?: IconProps['size'];
};

/**
 * Web loading spinner: a continuously rotating {@link LoaderIcon} wrapped in a `progressbar` live region.
 *
 * @param color tint applied to the spinner; defaults to 'white'
 * @param label accessible label for the `progressbar` role
 * @param size icon size token; defaults to `3xl`
 */
export function Spinner({ className, color = 'white', label, size = '3xl' }: SpinnerProps) {
	return (
		<span
			aria-hidden={label === null}
			aria-label={label || undefined}
			className={clsx(styles.spinner({ color }), className)}
			role="progressbar"
		>
			<LoaderIcon fill="currentColor" size={size} />
		</span>
	);
}
