import { Radio } from '@base-ui/react/radio';
import { RadioGroup as BaseRadioGroup } from '@base-ui/react/radio-group';

import * as styles from '#/components/web/RadioGroup.css';

export type RadioGroupItem<T extends string> = {
	label: string;
	value: T;
};

export type RadioGroupProps<T extends string> = {
	/** Accessible name for the group. */
	label: string;
	items: RadioGroupItem<T>[];
	value: T;
	onValueChange: (value: T) => void;
};

/** A single-select vertical radio list (circle left, label right) built on Base UI's RadioGroup. */
export function RadioGroup<T extends string>({ label, items, value, onValueChange }: RadioGroupProps<T>) {
	return (
		<BaseRadioGroup
			aria-label={label}
			value={value}
			onValueChange={(next) => onValueChange(next as T)}
			className={styles.group}
		>
			{items.map((item) => (
				<Radio.Root key={item.value} value={item.value} className={styles.item}>
					<span className={styles.circle}>
						<Radio.Indicator className={styles.dot} />
					</span>
					<span className={styles.text}>{item.label}</span>
				</Radio.Root>
			))}
		</BaseRadioGroup>
	);
}
