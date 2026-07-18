import { useEffect, useRef, useState } from 'react';

import { ErrorBoundary } from '#/view/com/util/ErrorBoundary';

import { useBreakpoints } from '#/alf';

import * as Dialog from '#/components/Dialog';
import { useThrottledValue } from '#/components/hooks/useThrottledValue';

import {
	GIF_CATEGORIES,
	type GifCategory,
	GifCategoryPills,
} from '#/features/gifPicker/components/GifCategoryPills';
import { GifPickerErrorBoundary } from '#/features/gifPicker/components/GifPickerErrorBoundary';
import { type GifPickerGridHandle, GifPickerGrid } from '#/features/gifPicker/components/GifPickerGrid';
import { GifPickerHeader } from '#/features/gifPicker/components/GifPickerHeader';
import { GifPickerPlaceholder } from '#/features/gifPicker/components/GifPickerPlaceholder';
import * as styles from '#/features/gifPicker/GifPickerDialog.css';
import { useGifPickerData } from '#/features/gifPicker/hooks/useGifPickerData';
import { useRecentGifs } from '#/features/gifPicker/hooks/useRecentGifs';
import type { Gif } from '#/features/gifPicker/types';

export function GifPickerDialog({
	handle,
	onClose,
	onSelectGif: onSelectGifProp,
}: {
	handle: Dialog.DialogHandle;
	onClose?: () => void;
	onSelectGif: (gif: Gif) => void;
}) {
	const onSelectGif = (gif: Gif) => {
		handle.close();
		onSelectGifProp(gif);
	};

	return (
		<Dialog.Root
			handle={handle}
			onOpenChange={(open) => {
				if (!open) {
					onClose?.();
				}
			}}
		>
			<Dialog.Viewport>
				<Dialog.Close variant="outer" />
				<Dialog.Card scroll="body" label="GIFs" fullHeight>
					<ErrorBoundary
						renderError={(error) => <GifPickerErrorBoundary handle={handle} details={String(error)} />}
					>
						<GifPickerBody handle={handle} onSelectGif={onSelectGif} />
					</ErrorBoundary>
				</Dialog.Card>
			</Dialog.Viewport>
		</Dialog.Root>
	);
}

function GifPickerBody({
	handle,
	onSelectGif,
}: {
	handle: Dialog.DialogHandle;
	onSelectGif: (gif: Gif) => void;
}) {
	const { gtMobile } = useBreakpoints();
	const inputRef = useRef<HTMLInputElement>(null);
	const gridRef = useRef<GifPickerGridHandle>(null);
	const [rawSearch, setRawSearch] = useState('');
	const [activeCategory, setActiveCategory] = useState<string>('trending');
	const search = useThrottledValue(rawSearch, 750);
	const { getRecents, addRecent, hasRecents } = useRecentGifs();

	// Determine the effective search query:
	// - If user is typing, use the throttled text
	// - If user clears the input, immediately drop the search (don't wait for
	//   the throttle to catch up — otherwise the previous query keeps driving
	//   the visible results until the next interval tick)
	// - If a non-trending category is active, use its searchterm
	// - Otherwise (trending/recents), empty string triggers the featured endpoint
	const activeCategorySearchterm = GIF_CATEGORIES.find((c) => c.id === activeCategory)?.searchterm ?? '';
	const effectiveSearch = rawSearch.length > 0 && search.length > 0 ? search : activeCategorySearchterm;

	const isRecentsActive = activeCategory === 'recents' && rawSearch.length === 0;

	const {
		data,
		fetchNextPage,
		isFetchingNextPage,
		hasNextPage,
		error,
		isPending,
		isError,
		isSearching,
		refetch,
	} = useGifPickerData(effectiveSearch, { enabled: !isRecentsActive });

	const networkItems = dedupeById(data?.pages.flatMap((page) => page.results) ?? []);
	const items = isRecentsActive ? getRecents() : networkItems;
	const hasData = items.length > 0;

	const onEndReached = () => {
		if (isRecentsActive) return;
		if (isFetchingNextPage || !hasNextPage || error) return;
		void fetchNextPage();
	};

	// Scroll to top when the effective query/category changes, NOT on every keystroke.
	useEffect(() => {
		gridRef.current?.scrollToTop();
	}, [effectiveSearch, isRecentsActive]);

	const onClearSearch = () => {
		setRawSearch('');
		setActiveCategory('trending');
		inputRef.current?.focus();
	};

	const onGoBack = () => {
		if (isSearching || activeCategory !== 'trending') {
			onClearSearch();
		} else {
			handle.close();
		}
	};

	const onChangeSearch = (text: string) => {
		setRawSearch(text);
	};

	const onSelectCategory = (category: GifCategory) => {
		setActiveCategory(category.id);
	};

	const handleSelectGif = (gif: Gif) => {
		addRecent(gif);
		onSelectGif(gif);
	};

	const showPills = rawSearch.length === 0;

	return (
		<>
			<div className={styles.header}>
				<GifPickerHeader
					inputRef={inputRef}
					value={rawSearch}
					onChangeText={onChangeSearch}
					onClear={onClearSearch}
					onEscape={() => handle.close()}
				/>
				{showPills && (
					<GifCategoryPills activeId={activeCategory} onSelect={onSelectCategory} hasRecents={hasRecents} />
				)}
			</div>
			{hasData ? (
				<GifPickerGrid
					ref={gridRef}
					items={items}
					numColumns={gtMobile ? 3 : 2}
					isFetchingNextPage={!isRecentsActive && isFetchingNextPage}
					error={isRecentsActive ? null : error}
					fetchNextPage={fetchNextPage}
					onEndReached={onEndReached}
					onSelectGif={handleSelectGif}
				/>
			) : (
				<div className={styles.placeholder}>
					<GifPickerPlaceholder
						isLoading={!isRecentsActive && isPending}
						isError={!isRecentsActive && isError}
						isSearching={isSearching}
						isRecentsEmpty={isRecentsActive}
						query={effectiveSearch}
						onRetry={refetch}
						onGoBack={onGoBack}
					/>
				</div>
			)}
		</>
	);
}

function dedupeById(items: Gif[]): Gif[] {
	const seen = new Set<string>();
	const out: Gif[] = [];
	for (const item of items) {
		if (seen.has(item.id)) continue;
		seen.add(item.id);
		out.push(item);
	}
	return out;
}
