import type { ReactNode } from 'react';

import { clsx } from 'clsx';

import { Text } from '#/components/Text';
import * as styles from '#/components/web/Dialog/Header.css';

export function Outer({
	border = true,
	className,
	children,
}: {
	border?: boolean;
	className?: string;
	children: ReactNode;
}) {
	return <div className={clsx(styles.outer, !border && styles.borderless, className)}>{children}</div>;
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
