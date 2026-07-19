import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

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
	className,
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
	className?: string;
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
			className={clsx(css.footer({ border }), className)}
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
	noEmpty,
	isError,
	emptyTitle,
	emptyMessage,
	errorTitle,
	errorMessage,
	emptyType = 'page',
	onRetry,
	onGoBack,
	hideBackButton,
	topBorder = false,
	emptyStateIcon,
	emptyStateButton,
	useEmptyState = false,
}: {
	isLoading: boolean;
	noEmpty?: boolean;
	isError?: boolean;
	emptyTitle?: string;
	emptyMessage?: string;
	errorTitle?: string;
	errorMessage?: string;
	emptyType?: 'page' | 'results';
	onRetry?: () => Promise<unknown>;
	onGoBack?: () => void;
	hideBackButton?: boolean;
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
				title={errorTitle ?? m['common.error.oops']()}
				message={errorMessage ?? m['common.error.generic']()}
				onRetry={onRetry}
				onGoBack={onGoBack}
				hideBackButton={hideBackButton}
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

	if (!noEmpty) {
		return (
			<Error
				title={
					emptyTitle ??
					(emptyType === 'results' ? m['common.list.noResults']() : m['common.error.pageNotFound']())
				}
				message={emptyMessage ?? m['common.error.notFoundDescription']()}
				onRetry={onRetry}
				onGoBack={onGoBack}
				hideBackButton={hideBackButton}
			/>
		);
	}

	return null;
}
export { ListMaybePlaceholder };
