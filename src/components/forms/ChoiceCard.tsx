import type { ComponentProps, ComponentType, SVGProps } from 'react';

import { clsx } from 'clsx';

import * as styles from '#/components/forms/ChoiceCard.css';
import { CheckboxIndicator, RadioIndicator } from '#/components/forms/Indicator';
import * as CheckboxPrimitive from '#/components/primitives/checkbox';
import * as RadioPrimitive from '#/components/primitives/radio';
import { Text } from '#/components/Text';

type CardContentProps = {
	icon: ComponentType<SVGProps<SVGSVGElement>>;
	titleText: string;
};

/**
 * stacks choice cards. supports Base UI's `render` prop.
 *
 * @param props container attributes and children
 * @returns a vertical card list
 */
export function List({ className, ...props }: ComponentProps<'div'>) {
	return <div {...props} className={clsx(styles.list, className)} />;
}

/**
 * a radio choice card. requires a `Radio.Group` parent.
 *
 * @param icon the leading icon
 * @param titleText the option's name
 * @param value the value this card selects
 * @returns a radio card
 */
export function Radio({ icon: Icon, titleText, value }: CardContentProps & { value: string }) {
	return (
		<RadioPrimitive.Root className={styles.card} value={value}>
			<Icon aria-hidden className={styles.icon} />
			<Text className={styles.title} size="md" weight="medium">
				{titleText}
			</Text>
			<RadioIndicator />
		</RadioPrimitive.Root>
	);
}

/**
 * a standalone checkbox choice card.
 *
 * @param checked whether the card is checked
 * @param icon the leading icon
 * @param onChange receives the new checked state
 * @param titleText the option's name
 * @returns a checkbox card
 */
export function Checkbox({
	checked,
	icon: Icon,
	onChange,
	titleText,
}: CardContentProps & { checked: boolean; onChange: (checked: boolean) => void }) {
	return (
		<CheckboxPrimitive.Root checked={checked} className={styles.card} onCheckedChange={onChange}>
			<Icon aria-hidden className={styles.icon} />
			<Text className={styles.title} size="md" weight="medium">
				{titleText}
			</Text>
			<CheckboxIndicator />
		</CheckboxPrimitive.Root>
	);
}
