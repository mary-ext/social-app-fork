import { clsx } from 'clsx';

import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';

import * as css from './Unavailable.css';

/**
 * "No longer available" state for a chat invite, shown when the link is disabled, invalid, or otherwise can't
 * be resolved. The outer container (height, border, etc.) varies per surface, so pass it via `className`.
 */
export function Unavailable({ className }: { className?: string }) {
	return (
		<div className={clsx(css.unavailable, className)}>
			<WarningIcon size="md" fill="currentColor" />
			<Text size="md" weight="medium" color="textContrastMedium">
				{m['common.error.inviteUnavailable']()}
			</Text>
		</div>
	);
}
