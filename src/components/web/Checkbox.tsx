import { Checkbox as BaseCheckbox } from '@base-ui/react/checkbox';

import * as styles from '#/components/web/Checkbox.css';
import { CheckThick_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';

export type CheckboxProps = {
	/** Accessible name; also rendered as the visible label. */
	label: string;
	checked: boolean;
	onChange: (checked: boolean) => void;
};

/** A standalone labeled checkbox (label left, box right) built on Base UI's Checkbox. */
export function Checkbox({ label, checked, onChange }: CheckboxProps) {
	return (
		<BaseCheckbox.Root aria-label={label} checked={checked} onCheckedChange={onChange} className={styles.root}>
			<span className={styles.label}>{label}</span>
			<span className={styles.box}>
				<BaseCheckbox.Indicator className={styles.indicator}>
					<CheckIcon width={14} fill="currentColor" />
				</BaseCheckbox.Indicator>
			</span>
		</BaseCheckbox.Root>
	);
}
