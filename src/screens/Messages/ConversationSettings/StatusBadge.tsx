import { clsx } from 'clsx';

import * as styles from '#/screens/Messages/ConversationSettings/StatusBadge.css';

import { Text } from '#/components/Text';

export function StatusBadge({ className, label }: { className?: string; label: string }) {
	const content = (
		<Text size="sm" weight="semiBold" color="textContrastMedium">
			{label}
		</Text>
	);

	return <span className={clsx(styles.badge, className)}>{content}</span>;
}
