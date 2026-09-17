import type { Ref } from 'react';

import * as styles from '#/features/gifPicker/components/GifPickerHeader.css';

import { SearchInput } from '#/components/forms/SearchInput';
import { Button, ButtonIcon } from '#/components/web/Button';

import ArrowLeft from '#/icons/central/ArrowLeft_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

export function GifPickerHeader({
	inputRef,
	value,
	onChangeText,
	onClear,
	onClose,
}: {
	inputRef: Ref<HTMLInputElement>;
	value: string;
	onChangeText: (text: string) => void;
	onClear: () => void;
	onClose: () => void;
}) {
	return (
		<div className={styles.root}>
			<Button
				className={styles.back}
				color="secondary"
				label={m['common.action.goBack']()}
				onClick={onClose}
				shape="round"
				variant="ghost"
			>
				<ButtonIcon icon={ArrowLeft} size="lg" />
			</Button>
			<SearchInput
				inputRef={inputRef}
				autoFocus
				label={m['features.gifPicker.search.a11y']()}
				maxLength={50}
				onChangeText={onChangeText}
				onClear={onClear}
				onKeyDown={(e) => {
					if (e.key === 'Escape') {
						onClose();
					}
				}}
				placeholder={m['features.gifPicker.search.placeholder']()}
				value={value}
			/>
		</div>
	);
}
