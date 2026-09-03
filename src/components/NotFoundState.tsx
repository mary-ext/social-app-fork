import type { ReactNode } from 'react';

import PageCrossTextIcon from '#/icons/central/PageCrossText_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { ContentState, type ContentStateProps } from './ContentState';

export type NotFoundStateProps = Omit<ContentStateProps, 'icon' | 'message' | 'onRetry' | 'title'> & {
	message?: ReactNode;
	title?: string;
};

/**
 * displays a content region for a resource or route that is known to be missing.
 *
 * @param headerTitle optional standalone header title
 * @param message optional message replacing the generic not-found copy
 * @param props content state options
 * @param title optional heading
 * @returns a not-found content state
 */
export function NotFoundState({
	headerTitle = m['common.error.notFound'](),
	message = m['common.error.notFoundMessage'](),
	title,
	...props
}: NotFoundStateProps) {
	return (
		<ContentState
			{...props}
			headerTitle={headerTitle}
			icon={PageCrossTextIcon}
			message={message}
			title={title}
		/>
	);
}
