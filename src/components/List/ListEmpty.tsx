import type { ComponentProps } from 'react';

import { EmptyState } from '#/components/EmptyState';

/**
 * renders an empty list state.
 *
 * @param props forwarded to {@link EmptyState}
 * @returns the empty state
 */
export function ListEmpty(props: Omit<ComponentProps<typeof EmptyState>, 'messageColor'>) {
	return <EmptyState {...props} messageColor="textContrastMedium" />;
}
