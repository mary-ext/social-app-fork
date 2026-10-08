import { clsx } from 'clsx';

import { CheckboxIndicator } from '#/components/forms/Indicator';
import * as CheckboxPrimitive from '#/components/primitives/checkbox';

import * as styles from './Checkbox.css';

type CheckboxProps = Omit<CheckboxPrimitive.RootProps, 'children' | 'className' | 'render'> & {
	className?: string;
};

/**
 * renders a checkbox with checked, unchecked, and indeterminate states.
 *
 * @param props checkbox state, accessibility attributes, and event handlers
 * @returns a styled checkbox
 */
export const Checkbox = ({ className, ...props }: CheckboxProps) => (
	<CheckboxPrimitive.Root {...props} className={clsx(styles.root, className)}>
		<CheckboxIndicator />
	</CheckboxPrimitive.Root>
);
