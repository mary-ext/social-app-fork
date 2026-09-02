'use no memo'; // generated cache cost outweighs reuse in these shallow renderers

import { clsx } from 'clsx';

import * as css from '#/components/Spacer.css';

/** expands to fill leftover space along its flex line. */
export function Spacer({ className }: { className?: string }) {
	return <div aria-hidden className={clsx(css.root, className)} />;
}
