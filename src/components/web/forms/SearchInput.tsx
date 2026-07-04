import type { FocusEventHandler, KeyboardEventHandler, Ref } from 'react';

import * as SearchField from '#/components/web/forms/SearchField';

import { m } from '#/paraglide/messages';

/**
 * search field with a leading magnifying-glass icon, a text input, and a trailing clear button shown when
 * `value` is non-empty and `onClear` is provided.
 */
export function SearchInput({
	autoFocus,
	inputRef,
	label,
	maxLength,
	onChangeText,
	onClear,
	onFocus,
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
	onFocus?: FocusEventHandler<HTMLInputElement>;
	onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
	placeholder?: string;
	value: string;
}) {
	return (
		<SearchField.Root>
			<SearchField.Icon />
			<SearchField.Input
				aria-label={label}
				autoFocus={autoFocus}
				maxLength={maxLength}
				onChange={(e) => onChangeText(e.currentTarget.value)}
				onFocus={onFocus}
				onKeyDown={onKeyDown}
				placeholder={placeholder}
				ref={inputRef}
				value={value}
			/>
			{onClear && value.length > 0 && (
				<SearchField.Clear label={m['common.search.action.clear']()} onClick={onClear} />
			)}
		</SearchField.Root>
	);
}
