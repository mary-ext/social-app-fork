import type { ReactNode } from 'react';

import { clsx } from 'clsx';

import * as css from '#/components/Stack.css';

/** stacks its children in a vertical column. */
export function Stack({
	children,
	gap = 'lg',
	className,
}: {
	children: ReactNode;
	gap?: '_2xl' | 'lg' | 'md' | 'sm' | 'xl' | 'xs';
	className?: string;
}) {
	return <div className={clsx(css.root({ gap }), className)}>{children}</div>;
}
