import * as styles from '#/screens/Messages/ConversationSettings/StatusBadge.css';

import { Text } from '#/components/Text';

export function StatusBadge({ label }: { label: string }) {
	const content = (
		<Text size="sm" weight="semiBold" color="textContrastMedium">
			{label}
		</Text>
	);

	return <span className={styles.badge}>{content}</span>;
}
