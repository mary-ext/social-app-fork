import { Select as BaseSelect } from '@base-ui/react/select';

import { Check_Stroke2_Corner0_Rounded as CheckIcon } from '#/components/icons/Check';
import { ChevronBottom_Stroke2_Corner0_Rounded as ChevronDownIcon } from '#/components/icons/Chevron';
import * as styles from '#/components/web/Select.css';

export type SelectItem = {
	label: string;
	value: string;
};

export type SelectProps = {
	/** Accessible name for the trigger. */
	label: string;
	items: SelectItem[];
	value: string;
	onValueChange: (value: string) => void;
	placeholder?: string;
	disabled?: boolean;
};

/** A single-select dropdown built on Base UI's Select. */
export function Select({ label, items, value, onValueChange, placeholder, disabled }: SelectProps) {
	return (
		<BaseSelect.Root
			items={items}
			value={value}
			disabled={disabled}
			onValueChange={(next) => onValueChange(next as string)}
		>
			<BaseSelect.Trigger aria-label={label} className={styles.trigger}>
				<BaseSelect.Value className={styles.value} placeholder={placeholder} />
				<BaseSelect.Icon className={styles.icon}>
					<ChevronDownIcon size="xs" fill="currentColor" />
				</BaseSelect.Icon>
			</BaseSelect.Trigger>
			<BaseSelect.Portal>
				<BaseSelect.Positioner className={styles.positioner} sideOffset={5}>
					<BaseSelect.Popup className={styles.popup}>
						<BaseSelect.List className={styles.list}>
							{items.map((item) => (
								<BaseSelect.Item
									key={item.value}
									value={item.value}
									label={item.label}
									className={styles.item}
								>
									<BaseSelect.ItemIndicator className={styles.indicator}>
										<CheckIcon size="sm" fill="currentColor" />
									</BaseSelect.ItemIndicator>
									<BaseSelect.ItemText>{item.label}</BaseSelect.ItemText>
								</BaseSelect.Item>
							))}
						</BaseSelect.List>
					</BaseSelect.Popup>
				</BaseSelect.Positioner>
			</BaseSelect.Portal>
		</BaseSelect.Root>
	);
}
