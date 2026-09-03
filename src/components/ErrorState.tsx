import type { ReactNode } from 'react';

import WarningIcon from '#/icons/central/ExclamationTriangle_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { ContentState, type ContentStateProps } from './ContentState';

export type ErrorStateProps = Omit<ContentStateProps, 'icon' | 'message'> & {
	message?: ReactNode;
};

/**
 * displays a content region that could not be loaded.
 *
 * @param message optional message replacing the generic error copy
 * @param props content state options
 * @returns an error content state
 */
export function ErrorState({ message = m['common.error.generic'](), ...props }: ErrorStateProps) {
	return <ContentState {...props} icon={WarningIcon} message={message} />;
}
