import { CenteredSpinner } from '#/components/CenteredSpinner';
import { Text } from '#/components/Text';
import { Button, ButtonText } from '#/components/web/Button';

import * as styles from '#/features/gifPicker/components/GifPickerPlaceholder.css';
import { m } from '#/paraglide/messages';

export function GifPickerPlaceholder({
	isLoading,
	isError,
	isSearching,
	isRecentsEmpty,
	query,
	onRetry,
	onGoBack,
}: {
	isLoading: boolean;
	isError: boolean;
	isSearching: boolean;
	isRecentsEmpty: boolean;
	query: string;
	onRetry: () => Promise<unknown>;
	onGoBack: () => void;
}) {
	if (isLoading) {
		return <CenteredSpinner label={m['features.gifPicker.label.loading']()} size="2xl" fill />;
	}

	if (isError) {
		return (
			<div className={styles.center}>
				<Text size="lg" weight="semiBold">
					{m['features.gifPicker.error.loadTitle']()}
				</Text>
				<Text size="sm" color="textContrastMedium">
					{m['features.gifPicker.error.loadBody']()}
				</Text>
				<Button
					label={m['common.action.tryAgain']()}
					size="small"
					color="secondary"
					onClick={() => void onRetry()}
				>
					<ButtonText>{m['common.action.tryAgain']()}</ButtonText>
				</Button>
			</div>
		);
	}

	const emptyMessage = isSearching
		? m['features.gifPicker.empty.searchNoResults']({ query })
		: isRecentsEmpty
			? m['features.gifPicker.empty.recents']()
			: m['features.gifPicker.empty.trending']();

	return (
		<div className={styles.center}>
			<Text size="sm" color="textContrastMedium">
				{emptyMessage}
			</Text>
			{(isSearching || isRecentsEmpty) && (
				<Button label={m['common.action.goBack']()} size="small" color="secondary" onClick={onGoBack}>
					<ButtonText>{m['common.action.goBack']()}</ButtonText>
				</Button>
			)}
		</div>
	);
}
