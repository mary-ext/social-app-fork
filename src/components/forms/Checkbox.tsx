import type { ComponentProps } from 'react';

import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';
import { clsx } from 'clsx';

import { CheckboxIndicator } from '#/components/forms/Indicator';

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
		<CheckboxIndicator />
	</BaseCheckbox.Root>
);
