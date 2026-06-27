import { View } from 'react-native';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import { cleanError } from '#/lib/strings/errors';

import { EmptyState, type EmptyStateButtonProps, type EmptyStateIcon } from '#/view/com/util/EmptyState';
import { CenteredView } from '#/view/com/util/Views';

import { atoms as a, useBreakpoints, useTheme } from '#/alf';

import { Error } from '#/components/Error';
import * as css from '#/components/Lists.css';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Text';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

export function ListFooter({
	className,
	endMessageText,
	error,
	hasNextPage,
	height,
	isFetchingNextPage,
	onRetry,
	showEndMessage = false,
}: {
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
			className={clsx(css.footer, className)}
			style={height != null ? assignInlineVars({ [css.heightVar]: `${height}px` }) : undefined}
		>
			{isFetchingNextPage ? (
				<Loader size="xl" />
			) : error ? (
				<ListFooterError error={error} onRetry={onRetry} />
			) : !hasNextPage && showEndMessage ? (
				<Text color="textContrastLow" size="sm">
					{endMessageText ?? m['components.lists.endOfList']()}
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
	sideBorders,
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
	sideBorders?: boolean;
	topBorder?: boolean;
	emptyStateIcon?: EmptyStateIcon | React.ReactElement;
	emptyStateButton?: EmptyStateButtonProps;
	useEmptyState?: boolean;
}): React.ReactNode {
	const t = useTheme();
	const { gtMobile, gtTablet } = useBreakpoints();

	if (isLoading) {
		return (
			<CenteredView
				style={[
					a.h_full_vh,
					a.align_center,
					!gtMobile ? a.justify_between : a.gap_5xl,
					t.atoms.border_contrast_low,
					{ paddingTop: 175, paddingBottom: 110 },
				]}
				sideBorders={sideBorders ?? gtMobile}
				topBorder={topBorder && !gtTablet}
			>
				<View style={[a.w_full, a.align_center, { top: 100 }]}>
					<Loader size="xl" />
				</View>
			</CenteredView>
		);
	}

	if (isError) {
		return (
			<Error
				title={errorTitle ?? m['common.error.oops']()}
				message={errorMessage ?? m['components.lists.error']()}
				onRetry={onRetry}
				onGoBack={onGoBack}
				sideBorders={sideBorders}
				hideBackButton={hideBackButton}
			/>
		);
	}

	if (useEmptyState) {
		return (
			<CenteredView style={[t.atoms.border_contrast_low]} sideBorders={sideBorders ?? gtMobile}>
				<EmptyState
					icon={emptyStateIcon}
					message={
						emptyMessage ??
						(emptyType === 'results' ? m['components.lists.noResults']() : m['common.error.pageNotFound']())
					}
					button={emptyStateButton}
				/>
			</CenteredView>
		);
	}

	if (!noEmpty) {
		return (
			<Error
				title={
					emptyTitle ??
					(emptyType === 'results' ? m['components.lists.noResults']() : m['common.error.pageNotFound']())
				}
				message={emptyMessage ?? m['common.error.notFoundDescription']()}
				onRetry={onRetry}
				onGoBack={onGoBack}
				hideBackButton={hideBackButton}
				sideBorders={sideBorders}
			/>
		);
	}

	return null;
}
export { ListMaybePlaceholder };
