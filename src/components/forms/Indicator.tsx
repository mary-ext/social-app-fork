import { clsx } from 'clsx';

import * as styles from '#/components/forms/Indicator.css';
import * as Checkbox from '#/components/primitives/checkbox';
import * as Radio from '#/components/primitives/radio';

import CheckIcon from '#/icons/central/Checkmark2_round_outlined_radius1_stroke3.svg';

/**
 * render directly inside a `Radio.Root`.
 *
 * @param className extra classes for the outer circle
 * @returns a radio indicator
 */
export function RadioIndicator({ className }: { className?: string }) {
	return (
		<span aria-hidden className={clsx(styles.radio, className)}>
			<Radio.Indicator className={styles.radioDot} />
		</span>
	);
}

/**
 * render directly inside a `Checkbox.Root`.
 *
 * @param className extra classes for the outer box
 * @returns a checkbox indicator with checked and indeterminate states
 */
export function CheckboxIndicator({ className }: { className?: string }) {
	return (
		<span aria-hidden className={clsx(styles.checkbox, className)}>
			<Checkbox.Indicator className={styles.checkboxIndicator}>
				<CheckIcon className={styles.checkIcon} />
			</Checkbox.Indicator>
		</span>
	);
}
