import { clsx } from 'clsx';

import type { Props as IconProps } from '#/components/icons/common';
import * as styles from '#/components/web/CenteredSpinner.css';
import { Spinner } from '#/components/web/Spinner';

import { vars } from '#/styles/contract.css';

type CenteredSpinnerProps = {
	/** Accessible label announced by the spinner's `progressbar` role (e.g. "Loading GIFs"). */
	label: string;
	/** Icon size token forwarded to the {@link Spinner}. */
	size?: IconProps['size'];
	/** Grow to fill a flex-column parent so the spinner centers vertically in an empty region. */
	fill?: boolean;
};

/** A {@link Spinner} centered in its own box, tinted with the themed muted text color. */
export function CenteredSpinner({ label, size, fill = false }: CenteredSpinnerProps) {
	return (
		<div className={clsx(styles.center, fill && styles.fill)}>
			<Spinner color={vars.palette.contrast_500} label={label} size={size} />
		</div>
	);
}
