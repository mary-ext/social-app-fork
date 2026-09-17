import * as styles from '#/features/gifPicker/components/GifPickerPlaceholder.css';

import { Text } from '#/components/Text';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

/**
 * empty feed message with an optional back button.
 *
 * @param message explains why the feed is empty
 * @param onGoBack called by the back button; omitting it hides the button
 */
export function GifPickerEmptyState({ message, onGoBack }: { message: string; onGoBack?: () => void }) {
	return (
		<div className={styles.center}>
			<Text size="sm" color="textContrastMedium">
				{message}
			</Text>
			{onGoBack && (
				<Button label={m['common.action.goBack']()} size="small" color="secondary" onClick={onGoBack}>
					<ButtonText>{m['common.action.goBack']()}</ButtonText>
				</Button>
			)}
		</div>
	);
}

/**
 * error message and retry button for a failed first page.
 *
 * @param onRetry reloads the feed
 */
export function GifPickerErrorState({ onRetry }: { onRetry: () => void }) {
	return (
		<div className={styles.center}>
			<Text size="lg" weight="semiBold">
				{m['features.gifPicker.load.error.title']()}
			</Text>
			<Text size="sm" color="textContrastMedium">
				{m['features.gifPicker.load.error.message']()}
			</Text>
			<Button label={m['common.action.tryAgain']()} size="small" color="secondary" onClick={onRetry}>
				<ButtonText>{m['common.action.tryAgain']()}</ButtonText>
			</Button>
		</div>
	);
}
