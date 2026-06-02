import type { ComponentType, ReactNode } from 'react';
import { Checkbox } from '@base-ui/react/checkbox';
import { CheckboxGroup } from '@base-ui/react/checkbox-group';

import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import type { Props as IconProps } from '#/components/icons/common';
import * as styles from '#/components/web/Toggle.css';

/** A multi-select checkbox group rendering a rounded, stacked list of rows. */
export function Group({
	label,
	values,
	onChange,
	children,
}: {
	label: string;
	values: string[];
	onChange: (values: string[]) => void;
	children: ReactNode;
}) {
	return (
		<CheckboxGroup aria-label={label} value={values} onValueChange={onChange} className={styles.group}>
			{children}
		</CheckboxGroup>
	);
}

/** A checkbox row within a `Group`; `value` is the entry added to / removed from the group's values. */
export function Item({ value, label }: { value: string; label: string }) {
	return (
		<Checkbox.Root name={value} aria-label={label} className={styles.row}>
			<span className={styles.box}>
				<Checkbox.Indicator className={styles.indicator}>
					<CheckIcon size="xs" fill="currentColor" />
				</Checkbox.Indicator>
			</span>
			<span className={styles.text}>{label}</span>
		</Checkbox.Root>
	);
}

/** A non-checkbox action row (e.g. "Add more…") styled to match the stack. */
export function Action({
	label,
	icon: Icon,
	onClick,
	children,
}: {
	label: string;
	icon?: ComponentType<IconProps>;
	onClick: () => void;
	children: ReactNode;
}) {
	return (
		<button type="button" aria-label={label} className={styles.row} onClick={onClick}>
			{Icon && (
				<span className={styles.actionIcon}>
					<Icon size="md" fill="currentColor" />
				</span>
			)}
			<span className={styles.text}>{children}</span>
		</button>
	);
}
