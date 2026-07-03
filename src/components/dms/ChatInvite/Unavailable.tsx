import { clsx } from 'clsx';

import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';

import * as css from './Unavailable.css';

/**
 * state for a chat invite that is no longer available, shown when the link is disabled, invalid, or cannot be
 * resolved.
 *
 * @param className class name applied to the outer container
 */
export function Unavailable({ className }: { className?: string }) {
	return (
		<div className={clsx(css.unavailable, className)}>
			<WarningIcon size="lg" fill="currentColor" />
			<Text size="md" weight="medium" color="textContrastMedium">
				{m['common.chat.error.inviteUnavailable']()}
			</Text>
		</div>
	);
}
