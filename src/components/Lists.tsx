import { assignInlineVars } from '@vanilla-extract/dynamic';

import { cleanError } from '#/lib/strings/errors';

import { EmptyState, type EmptyStateButtonProps, type EmptyStateIcon } from '#/view/com/util/EmptyState';

import { Error } from '#/components/Error';
import * as css from '#/components/Lists.css';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

export function ListFooter({
	border = true,
	endMessageText,
	error,
	hasNextPage,
	height,
	isFetchingNextPage,
	onRetry,
	showEndMessage = false,
}: {
	/** whether to draw the divider above the footer. */
	border?: boolean;
	endMessageText?: string;
	error?: string;
	hasNextPage?: boolean;
	height?: number;
	isFetchingNextPage?: boolean;
	onRetry?: () => Promise<unknown>;
	showEndMessage?: boolean;
}) {
	return (
		<div
			className={css.footer({ border })}
			style={height != null ? assignInlineVars({ [css.heightVar]: `${height}px` }) : undefined}
		>
			{isFetchingNextPage ? (
				<Spinner color="default" label={m['common.status.loading']()} size="2xl" />
			) : error ? (
				<ListFooterError error={error} onRetry={onRetry} />
			) : !hasNextPage && showEndMessage ? (
				<Text color="textContrastLow" size="sm">
					{endMessageText ?? m['common.list.endOfList']()}
				</Text>
			) : null}
		</div>
	);
}

function ListFooterError({ error, onRetry }: { error: string; onRetry?: () => Promise<unknown> }) {
	return (
		<div className={css.errorOuter}>
			<div className={css.errorRow}>
				<Text className={css.errorText} color="textContrastMedium" numberOfLines={2} size="sm">
					{cleanError(error)}
				</Text>
				<Button label={m['common.a11y.pressToRetry']()} onClick={() => void onRetry?.()} variant="solid">
					<ButtonText>{m['common.action.retry']()}</ButtonText>
				</Button>
			</div>
		</div>
	);
}

function ListMaybePlaceholder({
	isLoading,
	isError,
	emptyTitle,
	emptyMessage,
	errorMessage,
	emptyType = 'page',
	onRetry,
	topBorder = false,
	emptyStateIcon,
	emptyStateButton,
	useEmptyState = false,
}: {
	isLoading: boolean;
	isError?: boolean;
	emptyTitle?: string;
	emptyMessage?: string;
	errorMessage?: string;
	emptyType?: 'page' | 'results';
	onRetry?: () => Promise<unknown>;
	topBorder?: boolean;
	emptyStateIcon?: EmptyStateIcon | React.ReactElement;
	emptyStateButton?: EmptyStateButtonProps;
	useEmptyState?: boolean;
}): React.ReactNode {
	if (isLoading) {
		return (
			<div className={css.placeholderLoading({ topBorder })}>
				<Spinner color="default" label={m['common.status.loading']()} size="2xl" />
			</div>
		);
	}

	if (isError) {
		return (
			<Error
				title={m['common.error.oops']()}
				message={errorMessage ?? m['common.error.generic']()}
				onRetry={onRetry}
			/>
		);
	}

	if (useEmptyState) {
		return (
			<EmptyState
				icon={emptyStateIcon}
				message={
					emptyMessage ??
					(emptyType === 'results' ? m['common.list.noResults']() : m['common.error.pageNotFound']())
				}
				button={emptyStateButton}
			/>
		);
	}

	return (
		<Error
			title={
				emptyTitle ??
				(emptyType === 'results' ? m['common.list.noResults']() : m['common.error.pageNotFound']())
			}
			message={emptyMessage ?? m['common.error.notFoundDescription']()}
			onRetry={onRetry}
		/>
	);
}
export { ListMaybePlaceholder };
