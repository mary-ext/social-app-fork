import { useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';

import { Spinner } from '#/components/Spinner';

import * as css from './Loading.css';

/**
 * Loading state for a chat invite: a centered spinner. The outer container (height, border, etc.) varies per
 * surface, so pass it via `className`.
 */
export function Loading({ className }: { className?: string }) {
	const { t: l } = useLingui();

	return (
		<div className={clsx(css.loading, className)}>
			<Spinner label={l`Loading`} color="currentColor" size="md" />
		</div>
	);
}
