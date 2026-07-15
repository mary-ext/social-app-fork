import type { ReactNode } from 'react';

import { Dialog as BaseDialog } from '@base-ui/react/dialog';
import { clsx } from 'clsx';

import * as styles from '#/components/Dialog/Header.css';
import { Text } from '#/components/Text';

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

/** Dialog heading for the sticky header slot. */
export function TitleText({ children }: { children: ReactNode }) {
	return (
		<BaseDialog.Title render={<Text size="lg" weight="semiBold" align="center" numberOfLines={1} />}>
			{children}
		</BaseDialog.Title>
	);
}
