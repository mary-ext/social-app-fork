import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { assignInlineVars } from '@vanilla-extract/dynamic';

import * as styles from '#/components/SegmentedControl.css';

export type SegmentedControlItem<T extends string> = {
	label: string;
	value: T;
};

export type SegmentedControlProps<T extends string> = {
	/** Accessible name for the group. */
	label: string;
	items: SegmentedControlItem<T>[];
	value: T;
	onValueChange: (value: T) => void;
};

/** A single-select segmented control built on Base UI's RadioGroup, with a sliding active indicator. */
export function SegmentedControl<T extends string>({
	label,
	items,
	value,
	onValueChange,
}: SegmentedControlProps<T>) {
	const index = Math.max(
		0,
		items.findIndex((item) => item.value === value),
	);
	return (
		<RadioGroup
			aria-label={label}
			value={value}
			onValueChange={(next) => onValueChange(next)}
			className={styles.root}
			style={assignInlineVars({
				[styles.countVar]: String(items.length),
				[styles.indexVar]: String(index),
			})}
		>
			<span className={styles.slider} />
			{items.map((item) => (
				<Radio.Root key={item.value} value={item.value} className={styles.item}>
					<span className={styles.text}>{item.label}</span>
				</Radio.Root>
			))}
		</RadioGroup>
	);
}
