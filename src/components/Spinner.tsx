import { clsx } from 'clsx';

import LoaderIcon from '#/icons/original/Loader.svg';
import type { iconSize } from '#/styles/tokens.css';

import * as styles from './Spinner.css';

type SpinnerProps = {
	className?: string;
	/** Tint applied to the spinner. */
	color?: 'white' | 'default';
	/** Accessible label announced by the `progressbar` role (e.g. "Loading GIF"). */
	label: string | null;
	/** Icon size token; defaults to `_3xl`. */
	size?: keyof typeof iconSize;
};

/**
 * Web loading spinner: a continuously rotating {@link LoaderIcon} wrapped in a `progressbar` live region.
 *
 * @param color tint applied to the spinner; defaults to 'white'
 * @param label accessible label for the `progressbar` role
 * @param size icon size token; defaults to `_3xl`
 */
export function Spinner({ className, color = 'white', label, size = '_3xl' }: SpinnerProps) {
	return (
		<span
			aria-hidden={label === null}
			aria-label={label || undefined}
			className={clsx(styles.spinner({ color }), className)}
			role="progressbar"
		>
			<LoaderIcon className={styles.icon[size]} />
		</span>
	);
}
