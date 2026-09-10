import type { ComponentProps } from 'react';

import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { clsx } from 'clsx';

import CheckIcon from '#/icons/central/Checkmark2_round_outlined_radius1_stroke2.svg';

import * as styles from './Checkbox.css';

type CheckboxProps = Omit<
	ComponentProps<typeof BaseCheckbox.Root>,
	'children' | 'className' | 'nativeButton' | 'render'
> & {
	className?: string;
};

/**
 * renders a checkbox with checked, unchecked, and indeterminate states.
 *
 * @param props checkbox state, accessibility attributes, and event handlers
 * @returns a styled checkbox button
 */
export const Checkbox = ({ className, ...props }: CheckboxProps) => (
	<BaseCheckbox.Root
		{...props}
		className={clsx(styles.root, className)}
		nativeButton
		render={<button type="button" />}
	>
		<span aria-hidden className={styles.box}>
			<BaseCheckbox.Indicator className={styles.indicator}>
				<CheckIcon className={styles.checkIcon} />
			</BaseCheckbox.Indicator>
		</span>
	</BaseCheckbox.Root>
);
