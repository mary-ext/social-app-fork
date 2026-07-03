import type { ComponentPropsWithoutRef, Ref } from 'react';

import { clsx } from 'clsx';

import * as styles from '#/screens/Messages/ConversationSettings/StatusBadge.css';

import { Text } from '#/components/Text';

type Props = Omit<ComponentPropsWithoutRef<'button'>, 'color'> & {
	label: string;
	/** Render an interactive `<button>` (e.g. to back a menu Trigger) instead of a static badge. */
	interactive?: boolean;
	ref?: Ref<HTMLButtonElement>;
};

export function StatusBadge({ className, interactive = false, label, ref, ...rest }: Props) {
	const content = (
		<Text size="sm" weight="semiBold" color="textContrastMedium">
			{label}
		</Text>
	);

	if (!interactive) {
		return <span className={clsx(styles.badge, className)}>{content}</span>;
	}

	return (
		<button ref={ref} className={clsx(styles.trigger, className)} {...rest}>
			{content}
		</button>
	);
}
