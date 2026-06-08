import { useLingui } from '@lingui/react/macro';

import { Button, ButtonText } from '#/components/web/Button';
import { CenteredSpinner } from '#/components/web/CenteredSpinner';
import { Text } from '#/components/web/Text';

import * as styles from '#/features/gifPicker/components/GifPickerPlaceholder.css';

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
	const { t: l } = useLingui();

	if (isLoading) {
		return <CenteredSpinner label={l`Loading GIFs`} size="2xl" fill />;
	}

	if (isError) {
		return (
			<div className={styles.center}>
				<Text size="lg" weight="semiBold">
					{l({
						message: 'Couldn’t load GIFs',
						comment: 'Title of the error screen shown when the GIF provider request fails.',
					})}
				</Text>
				<Text size="sm" color="textContrastMedium">
					{l({
						message: 'There was a problem loading GIFs. Check your connection and try again.',
						comment:
							'Body message of the error screen shown when the GIF provider request fails. Encourages the user to retry.',
					})}
				</Text>
				<Button label={l`Try again`} size="small" color="secondary" onClick={() => void onRetry()}>
					<ButtonText>{l`Try again`}</ButtonText>
				</Button>
			</div>
		);
	}

	const emptyMessage = isSearching
		? l({
				message: `No GIFs found for "${query}".`,
				comment:
					'Empty-state message shown in the GIF picker when a search returns zero results. Placeholder is the user’s search query.',
			})
		: isRecentsEmpty
			? l({
					message: 'No recent GIFs yet. Pick one to see it here.',
					comment:
						'Empty-state message shown in the GIF picker’s Recents tab before the user has selected any GIFs.',
				})
			: l({
					message: 'No GIFs to show right now. Try again in a moment.',
					comment:
						'Empty-state message shown when the trending/featured GIF feed returns no results (rare, usually a transient provider issue).',
				});

	return (
		<div className={styles.center}>
			<Text size="sm" color="textContrastMedium">
				{emptyMessage}
			</Text>
			{(isSearching || isRecentsEmpty) && (
				<Button label={l`Go back`} size="small" color="secondary" onClick={onGoBack}>
					<ButtonText>{l`Go back`}</ButtonText>
				</Button>
			)}
		</div>
	);
}
