import type { Ref } from 'react';

import { SearchInput } from '#/components/forms/SearchInput';

import * as styles from '#/features/gifPicker/components/GifPickerHeader.css';
import { m } from '#/paraglide/messages';

export function GifPickerHeader({
	inputRef,
	value,
	onChangeText,
	onClear,
	onEscape,
}: {
	inputRef: Ref<HTMLInputElement>;
	value: string;
	onChangeText: (text: string) => void;
	onClear: () => void;
	onEscape: () => void;
}) {
	return (
		<div className={styles.root}>
			<SearchInput
				inputRef={inputRef}
				label={m['features.gifPicker.search.a11y']()}
				maxLength={50}
				onChangeText={onChangeText}
				onClear={onClear}
				onKeyDown={(e) => {
					if (e.key === 'Escape') {
						onEscape();
					}
				}}
				placeholder={m['features.gifPicker.search.placeholder']()}
				value={value}
			/>
		</div>
	);
}
