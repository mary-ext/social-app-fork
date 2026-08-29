import type { ReactElement } from 'react';

import { EmptyState, type EmptyStateButtonProps, type EmptyStateIcon } from '#/components/EmptyState';

import { m } from '#/paraglide/messages';

/**
 * renders an empty list state.
 *
 * @param button optional action
 * @param className container class
 * @param icon state icon
 * @param message empty-state message
 * @returns the empty state
 */
export function ListEmpty({
	button,
	className,
	icon,
	message,
}: {
	button?: EmptyStateButtonProps;
	className?: string;
	icon?: EmptyStateIcon | ReactElement;
	message?: string;
}) {
	return (
		<EmptyState
			button={button}
			className={className}
			icon={icon}
			message={message ?? m['common.list.noResults']()}
			messageColor="textContrastMedium"
		/>
	);
}
