import PageCrossTextIcon from '#/icons/central/PageCrossText_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { ContentState, type ContentStateProps } from './ContentState';

export type NotFoundStateProps = Omit<ContentStateProps, 'icon' | 'message' | 'onRetry' | 'title'>;

/**
 * displays a content region for a resource or route that is known to be missing.
 *
 * @param headerTitle optional standalone header title
 * @param props content state options
 * @returns a not-found content state
 */
export function NotFoundState({ headerTitle, ...props }: NotFoundStateProps) {
	return (
		<ContentState
			{...props}
			headerTitle={headerTitle ?? m['common.error.notFound']()}
			icon={PageCrossTextIcon}
			message={m['common.error.notFoundMessage']()}
			title={m['common.error.notFound']()}
		/>
	);
}
