import type { Ref } from 'react';
import { useLingui } from '@lingui/react/macro';

import { SearchInput } from '#/components/web/forms/SearchInput';

import * as styles from '#/features/gifPicker/components/GifPickerHeader.css';

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
	const { t: l } = useLingui();

	return (
		<div className={styles.root}>
			<SearchInput
				inputRef={inputRef}
				label={l({
					message: 'Search GIFs',
					comment: 'Accessibility label for the GIF search input inside the GIF picker dialog.',
				})}
				maxLength={50}
				onChangeText={onChangeText}
				onClear={onClear}
				onKeyDown={(e) => {
					if (e.key === 'Escape') {
						onEscape();
					}
				}}
				placeholder={l({
					message: 'Search KLIPY',
					comment:
						'Placeholder text inside the GIF search input. KLIPY is the third-party GIF provider; keep the brand name as-is.',
				})}
				value={value}
			/>
		</div>
	);
}
