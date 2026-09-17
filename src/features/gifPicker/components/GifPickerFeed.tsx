import type { ReactNode } from 'react';

import { uniqueBy } from '@mary/array-fns';

import { cleanError } from '#/lib/errors';
import { useBreakpoints } from '#/lib/hooks/use-breakpoints';
import type { Gif } from '#/lib/media/external-gif/types';

import { useRecentGifs } from '#/state/preferences/recent-gifs';

import * as styles from '#/features/gifPicker/components/GifPickerFeed.css';
import { GifPickerGrid } from '#/features/gifPicker/components/GifPickerGrid';
import {
	GifPickerEmptyState,
	GifPickerErrorState,
} from '#/features/gifPicker/components/GifPickerPlaceholder';
import { useGifPickerData } from '#/features/gifPicker/hooks/useGifPickerData';

import { CenteredSpinner } from '#/components/CenteredSpinner';
import { Text } from '#/components/Text';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

/**
 * paginated KLIPY results with loading, error, and empty states.
 *
 * @param query search terms; an empty query loads the featured feed
 */
export function GifPickerFeed({
	emptyMessage,
	header,
	onGoBack,
	onSelectGif,
	query,
}: {
	emptyMessage: string;
	header?: ReactNode;
	onGoBack?: () => void;
	onSelectGif: (gif: Gif) => void;
	query: string;
}) {
	const { gtMobile } = useBreakpoints();
	const { data, error, fetchNextPage, hasNextPage, isError, isFetchingNextPage, isPending, refetch } =
		useGifPickerData(query);

	const items = uniqueBy(data?.pages.flatMap((page) => page.results) ?? [], (item) => item.id);

	const onEndReached = () => {
		if (isFetchingNextPage || !hasNextPage || error) {
			return;
		}
		void fetchNextPage();
	};

	let empty: ReactNode;
	if (isPending) {
		empty = <CenteredSpinner label={m['features.gifPicker.load.loading']()} size="_3xl" fill />;
	} else if (isError) {
		empty = <GifPickerErrorState onRetry={() => void refetch()} />;
	} else {
		empty = <GifPickerEmptyState message={emptyMessage} onGoBack={onGoBack} />;
	}

	let footer: ReactNode = null;
	if (isFetchingNextPage) {
		footer = <CenteredSpinner label={m['features.gifPicker.load.loading']()} size="_2xl" />;
	} else if (error && items.length > 0) {
		footer = (
			<div className={styles.footer}>
				<Text size="sm" color="textContrastMedium" align="center">
					{cleanError(error)}
				</Text>
				<Button
					label={m['common.action.retry']()}
					size="small"
					color="secondary"
					onClick={() => void fetchNextPage()}
				>
					<ButtonText>{m['common.action.retry']()}</ButtonText>
				</Button>
			</div>
		);
	}

	return (
		<GifPickerGrid
			empty={empty}
			footer={footer}
			header={header}
			items={items}
			numColumns={gtMobile ? 3 : 2}
			onEndReached={onEndReached}
			onSelectGif={onSelectGif}
		/>
	);
}

/**
 * a grid of the user's recently picked GIFs.
 *
 * @param onGoBack called by the empty state's back button
 */
export function RecentGifsFeed({
	onGoBack,
	onSelectGif,
}: {
	onGoBack: () => void;
	onSelectGif: (gif: Gif) => void;
}) {
	const { gtMobile } = useBreakpoints();
	const recentGifs = useRecentGifs();

	return (
		<GifPickerGrid
			empty={<GifPickerEmptyState message={m['features.gifPicker.recents.empty']()} onGoBack={onGoBack} />}
			items={recentGifs}
			numColumns={gtMobile ? 3 : 2}
			onSelectGif={onSelectGif}
		/>
	);
}
