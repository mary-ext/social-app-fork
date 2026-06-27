import { clsx } from 'clsx';

import { Spinner } from '#/components/Spinner';

import { m } from '#/paraglide/messages';

import * as css from './Loading.css';

/**
 * Loading state for a chat invite: a centered spinner. The outer container (height, border, etc.) varies per
 * surface, so pass it via `className`.
 */
export function Loading({ className }: { className?: string }) {
	return (
		<div className={clsx(css.loading, className)}>
			<Spinner label={m['common.status.loading']()} color="currentColor" size="md" />
		</div>
	);
}
