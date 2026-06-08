import type { Ref } from 'react';
import { useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';

import { MagnifyingGlass_Stroke2_Corner0_Rounded as Search } from '#/components/icons/MagnifyingGlass';
import { TimesLarge_Stroke2_Corner0_Rounded as X } from '#/components/icons/Times';
import { Button, ButtonIcon } from '#/components/web/Button';
import * as TextField from '#/components/web/TextField';

import * as styles from '#/features/gifPicker/components/GifPickerHeader.css';

export function GifPickerHeader({
	inputRef,
	value,
	onChangeText,
	onClear,
	onEscape,
	canClear,
}: {
	inputRef: Ref<HTMLInputElement>;
	value: string;
	onChangeText: (text: string) => void;
	onClear: () => void;
	onEscape: () => void;
	canClear: boolean;
}) {
	const { t: l } = useLingui();

	return (
		<div className={styles.root}>
			<div className={styles.field}>
				<span className={styles.icon}>
					<Search size="md" fill="currentColor" />
				</span>
				<TextField.Input
					label={l({
						message: 'Search GIFs',
						comment: 'Accessibility label for the GIF search input inside the GIF picker dialog.',
					})}
					placeholder={l({
						message: 'Search KLIPY',
						comment:
							'Placeholder text inside the GIF search input. KLIPY is the third-party GIF provider; keep the brand name as-is.',
					})}
					value={value}
					onChangeText={onChangeText}
					inputRef={inputRef}
					maxLength={50}
					onKeyDown={(e) => {
						if (e.key === 'Escape') {
							onEscape();
						}
					}}
					className={clsx(styles.input, canClear && styles.inputWithClear)}
				/>
				{canClear && (
					<Button
						size="small"
						color="secondary"
						shape="round"
						className={styles.clear}
						onClick={onClear}
						label={l({
							message: 'Clear GIF search',
							comment:
								'Accessibility label for the X button inside the search input that clears the typed query and returns to the trending feed.',
						})}
					>
						<ButtonIcon icon={X} size="sm" />
					</Button>
				)}
			</div>
		</div>
	);
}
