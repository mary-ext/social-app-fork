import { type ReactNode, useRef, useState } from 'react';

import { useThrottledValue } from '#/lib/hooks/use-debounce';
import type { Gif } from '#/lib/media/external-gif/types';

import { addRecentGif } from '#/state/preferences/recent-gifs';

import { type GifCategoryId, getGifCategory } from '#/features/gifPicker/categories';
import { GifPickerFeed, RecentGifsFeed } from '#/features/gifPicker/components/GifPickerFeed';
import { GifPickerHome } from '#/features/gifPicker/components/GifPickerHome';
import * as styles from '#/features/gifPicker/GifPickerDialog.css';
import { useRetainFeaturedGifs } from '#/features/gifPicker/queries';

import * as Dialog from '#/components/Dialog';
import { SearchInput } from '#/components/forms/SearchInput';
import { BackOrCloseButton, createNavigator } from '#/components/Navigator';

import { m } from '#/paraglide/messages';

type GifPickerRoutes = {
	category: { id: GifCategoryId };
	home: undefined;
	recents: undefined;
	search: undefined;
};

const GifPickerNavigator = createNavigator<GifPickerRoutes>();

/**
 * renders the GIF picker navigation and feeds.
 *
 * @param props dialog handle and GIF selection callback
 * @returns the picker content
 */
export const GifPickerDialogContent = ({
	handle,
	onSelectGif,
}: {
	handle: Dialog.DialogHandle;
	onSelectGif: (gif: Gif) => void;
}) => {
	return (
		<GifPickerNavigator.Provider initialRoute={{ name: 'home' }}>
			<GifPickerBody handle={handle} onSelectGif={onSelectGif} />
		</GifPickerNavigator.Provider>
	);
};

function GifPickerBody({
	handle,
	onSelectGif: onSelectGifProp,
}: {
	handle: Dialog.DialogHandle;
	onSelectGif: (gif: Gif) => void;
}) {
	const { direction, key, pop, push, route } = GifPickerNavigator.useNavigator();
	const inputRef = useRef<HTMLInputElement>(null);
	const [query, setQuery] = useState('');

	useRetainFeaturedGifs();

	const isSearching = route.name === 'search';

	const onSelectGif = (gif: Gif) => {
		addRecentGif(gif);
		handle.close();
		onSelectGifProp(gif);
	};

	const onChangeQuery = (text: string) => {
		setQuery(text);
		if (!isSearching && text.length > 0) {
			push({ name: 'search' });
		} else if (isSearching && text.length === 0) {
			pop();
		}
	};

	const onClearQuery = () => {
		onChangeQuery('');
		inputRef.current?.focus();
	};

	let title: string;
	let view: ReactNode;
	switch (route.name) {
		case 'category': {
			const category = getGifCategory(route.params.id);
			title = category.label();
			view = (
				<GifPickerFeed
					emptyMessage={m['features.gifPicker.feed.empty']()}
					onSelectGif={onSelectGif}
					query={category.query}
				/>
			);
			break;
		}
		case 'home': {
			title = m['features.gifPicker.title']();
			view = (
				<GifPickerFeed
					emptyMessage={m['features.gifPicker.feed.empty']()}
					header={
						<GifPickerHome
							onOpenCategory={(id) => push({ name: 'category', params: { id } })}
							onOpenRecents={() => push({ name: 'recents' })}
							onSelectGif={onSelectGif}
						/>
					}
					onSelectGif={onSelectGif}
					query=""
				/>
			);
			break;
		}
		case 'recents': {
			title = m['features.gifPicker.recents.title']();
			view = <RecentGifsFeed onGoBack={pop} onSelectGif={onSelectGif} />;
			break;
		}
		case 'search': {
			title = m['features.gifPicker.title']();
			view = <GifPickerSearch onClearQuery={onClearQuery} onSelectGif={onSelectGif} query={query} />;
			break;
		}
	}

	return (
		<>
			<Dialog.Header.Root>
				<BackOrCloseButton />
				<Dialog.Header.Title>{title}</Dialog.Header.Title>
			</Dialog.Header.Root>

			<Dialog.Search>
				<SearchInput
					autoFocus
					inputRef={inputRef}
					label={m['features.gifPicker.search.a11y']()}
					maxLength={50}
					onChangeText={onChangeQuery}
					onClear={onClearQuery}
					placeholder={m['features.gifPicker.search.placeholder']()}
					value={isSearching ? query : ''}
				/>
			</Dialog.Search>

			<div className={styles.views}>
				<div key={key} className={styles.view({ transition: isSearching ? 'fade' : direction })}>
					{view}
				</div>
			</div>
		</>
	);
}

// remount on each search visit so the throttle cannot show the previous query's results.
function GifPickerSearch({
	onClearQuery,
	onSelectGif,
	query,
}: {
	onClearQuery: () => void;
	onSelectGif: (gif: Gif) => void;
	query: string;
}) {
	const throttledQuery = useThrottledValue(query, 750);

	return (
		<GifPickerFeed
			key={throttledQuery}
			emptyMessage={m['features.gifPicker.search.empty']({ query: throttledQuery })}
			onGoBack={onClearQuery}
			onSelectGif={onSelectGif}
			query={throttledQuery}
		/>
	);
}
