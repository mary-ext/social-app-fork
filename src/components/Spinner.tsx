import type { Props as IconProps } from '#/components/icons/common';
import { Loader_Stroke2_Corner0_Rounded as LoaderIcon } from '#/components/icons/Loader';
import * as styles from '#/components/Spinner.css';

type SpinnerProps = {
	/** Tint applied via `currentColor`; defaults to white for the over-media surfaces that use it. */
	color?: string;
	/** Accessible label announced by the `progressbar` role (e.g. "Loading GIF"). */
	label: string | null;
	/** Icon size token; defaults to `2xl`. */
	size?: IconProps['size'];
};

/**
 * Web loading spinner: a continuously rotating {@link LoaderIcon} wrapped in a `progressbar` live region.
 *
 * @param color tint applied via `currentColor`; defaults to white
 * @param label accessible label for the `progressbar` role
 * @param size icon size token; defaults to `2xl`
 */
export function Spinner({ color = '#fff', label, size = '2xl' }: SpinnerProps) {
	return (
		<span
			aria-hidden={label === null}
			aria-label={label || undefined}
			className={styles.spinner}
			role="progressbar"
			style={{ color }}
		>
			<LoaderIcon fill="currentColor" size={size} />
		</span>
	);
}
