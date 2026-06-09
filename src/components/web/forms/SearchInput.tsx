import type { KeyboardEventHandler, Ref } from 'react';
import { useLingui } from '@lingui/react/macro';
import { clsx } from 'clsx';

import { MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlassIcon } from '#/components/icons/MagnifyingGlass';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Button, ButtonIcon } from '#/components/web/Button';
import * as styles from '#/components/web/forms/SearchInput.css';
import * as TextField from '#/components/web/TextField';

/**
 * A web-native search field: a leading magnifying-glass icon, a {@link TextField.Input}, and a trailing clear
 * (×) button shown whenever `value` is non-empty (and `onClear` is provided).
 */
export function SearchInput({
	autoFocus,
	inputRef,
	label,
	maxLength,
	onChangeText,
	onClear,
	onKeyDown,
	placeholder,
	value,
}: {
	autoFocus?: boolean;
	inputRef?: Ref<HTMLInputElement>;
	/** Accessible name. */
	label: string;
	maxLength?: number;
	onChangeText: (value: string) => void;
	/** Clears the query. The trailing (×) button is shown only while `value` is non-empty and this is set. */
	onClear?: () => void;
	onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
	placeholder?: string;
	value: string;
}) {
	const { t: l } = useLingui();
	const showClear = !!onClear && value.length > 0;

	return (
		<div className={styles.field}>
			<span className={styles.icon}>
				<MagnifyingGlassIcon size="md" fill="currentColor" />
			</span>
			<TextField.Input
				autoFocus={autoFocus}
				className={clsx(styles.input, showClear && styles.inputWithClear)}
				inputRef={inputRef}
				label={label}
				maxLength={maxLength}
				onChangeText={onChangeText}
				onKeyDown={onKeyDown}
				placeholder={placeholder}
				value={value}
			/>
			{showClear && (
				<Button
					className={styles.clear}
					color="secondary"
					label={l`Clear search`}
					onClick={onClear}
					shape="round"
					size="small"
				>
					<ButtonIcon icon={XIcon} size="sm" />
				</Button>
			)}
		</div>
	);
}
