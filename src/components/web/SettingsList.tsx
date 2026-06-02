import type { ComponentType, ReactNode } from 'react';

import type { Props as IconProps } from '#/components/icons/common';
import * as styles from '#/components/web/SettingsList.css';
import { Text } from '#/components/web/Text';

export function Container({ children }: { children: ReactNode }) {
	return <div className={styles.container}>{children}</div>;
}

/**
 * A titled settings section. Unlike the RNW original, this does not teleport icons/title into a header row —
 * children render in order, so write the `ItemText` heading first.
 */
export function Group({
	children,
}: {
	children: ReactNode;
	/** Accepted for API parity with the RNW list; a no-op here since this slice renders no item icons. */
	iconInset?: boolean;
}) {
	return <div className={styles.group}>{children}</div>;
}

export function ItemIcon({ icon: Icon }: { icon: ComponentType<IconProps> }) {
	return (
		<span className={styles.itemIcon}>
			<Icon size="lg" fill="currentColor" />
		</span>
	);
}

export function ItemText({ children }: { children: ReactNode }) {
	return (
		<Text size="md" color="text">
			{children}
		</Text>
	);
}

export function Divider() {
	return <div className={styles.divider} />;
}
