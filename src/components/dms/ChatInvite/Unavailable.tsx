import { clsx } from 'clsx';

import { Text } from '#/components/Text';

import WarningIcon from '#/icons/central/ExclamationTriangle_round_outlined_radius1_stroke2.svg';
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
			<WarningIcon className={css.warningIcon} />
			<Text size="md" weight="medium" color="textContrastMedium">
				{m['common.chat.error.inviteUnavailable']()}
			</Text>
		</div>
	);
}
