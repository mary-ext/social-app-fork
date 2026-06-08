import type { ReactNode } from 'react';
import { clsx } from 'clsx';

import * as styles from '#/components/web/Sheet/Header.css';
import { Text } from '#/components/web/Text';

/** Sticky header row. Compose with `Slot` (edge buttons) + `Content`/`TitleText`, like `Layout.Header`. */
export function Outer({ border = true, children }: { border?: boolean; children: ReactNode }) {
	return <div className={clsx(styles.outer, !border && styles.borderless)}>{children}</div>;
}

export function Content({ children }: { children?: ReactNode }) {
	return <div className={styles.content}>{children}</div>;
}

export function Slot({ children }: { children?: ReactNode }) {
	return <div className={styles.slot}>{children}</div>;
}

export function TitleText({ children }: { children: ReactNode }) {
	return (
		<Text size="lg" weight="semiBold" align="center" numberOfLines={1}>
			{children}
		</Text>
	);
}
