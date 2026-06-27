import {
	type ChangeEvent,
	type ComponentPropsWithoutRef,
	createContext,
	type FocusEventHandler,
	type KeyboardEventHandler,
	type ReactNode,
	type Ref,
	useContext,
	useId,
} from 'react';
import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import { LabelText as BaseLabelText } from '#/components/Text';
import * as styles from '#/components/TextField.css';

type FieldContextValue = {
	/** Generated id linking a field's {@link LabelText} to its {@link Input}; `undefined` outside a {@link Root}. */
	id: string | undefined;
	isInvalid: boolean;
};

const FieldContext = createContext<FieldContextValue>({ id: undefined, isInvalid: false });

/**
 * Groups a field's label + input, sharing a generated id so the {@link LabelText} is associated with the
 * {@link Input}, and propagating the invalid state to the input.
 */
export function Root({
	children,
	className,
	isInvalid = false,
}: {
	children: ReactNode;
	className?: string;
	isInvalid?: boolean;
}) {
	const id = useId();
	const value = { id, isInvalid };
	return (
		<FieldContext.Provider value={value}>
			<div className={clsx(styles.root, className)}>{children}</div>
		</FieldContext.Provider>
	);
}

export function LabelText({
	accessory,
	children,
	htmlFor,
}: {
	/**
	 * Optional content rendered to the trailing edge of the label, as a sibling of the `<label>` so it stays
	 * out of the field's accessible name.
	 */
	accessory?: ReactNode;
	children: ReactNode;
	htmlFor?: string;
}) {
	const { id } = useContext(FieldContext);
	const label = (
		<BaseLabelText
			className={accessory === undefined ? styles.label : undefined}
			color="textContrastMedium"
			htmlFor={htmlFor ?? id}
			size="md_sub"
			weight="medium"
		>
			{children}
		</BaseLabelText>
	);

	if (accessory === undefined) {
		return label;
	}

	// a flex row pairing the <label> with a sibling accessory, not a text leaf — the *Text-returns-<Text> rule doesn't apply
	// eslint-disable-next-line bsky-internal/avoid-unwrapped-text
	return (
		<div className={styles.labelRow}>
			{label}
			{accessory}
		</div>
	);
}

export type InputProps = {
	/** Accessible name. */
	label: string;
	/** Id of an element describing the field, wired to `aria-describedby` (e.g. a character counter or hint). */
	describedBy?: string;
	autoFocus?: boolean;
	value?: string;
	defaultValue?: string;
	onChangeText?: (value: string) => void;
	placeholder?: string;
	isInvalid?: boolean;
	multiline?: boolean;
	/** Caps the autosizing height of a `multiline` input; further lines scroll within it. */
	maxRows?: number;
	/** Initial (and minimum) row count for a `multiline` input; it grows from here. */
	minRows?: number;
	/** Caps the number of characters accepted. */
	maxLength?: number;
	/** Ref to the underlying single-line `<input>` (e.g. to focus or clear it imperatively). */
	inputRef?: Ref<HTMLInputElement>;
	onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
	onBlur?: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
	onFocus?: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
	/** Autofill hint for the single-line `<input>` (e.g. `url`). */
	autoComplete?: ComponentPropsWithoutRef<'input'>['autoComplete'];
	/** Auto-capitalization behaviour for the single-line `<input>`. */
	autoCapitalize?: ComponentPropsWithoutRef<'input'>['autoCapitalize'];
	id?: string;
	className?: string;
};

export function Input({
	label,
	describedBy,
	autoFocus,
	value,
	defaultValue,
	onChangeText,
	placeholder,
	isInvalid,
	multiline = false,
	maxRows,
	minRows,
	maxLength,
	inputRef,
	onKeyDown,
	onBlur,
	onFocus,
	autoComplete,
	autoCapitalize,
	id,
	className,
}: InputProps) {
	const { id: ctxId, isInvalid: ctxInvalid } = useContext(FieldContext);
	const invalid = isInvalid ?? ctxInvalid;
	const inputId = id ?? ctxId;
	const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
		onChangeText?.(e.currentTarget.value);
	const cls = clsx(styles.input, multiline && styles.multiline, invalid && styles.invalid, className);

	if (multiline) {
		return (
			<textarea
				aria-describedby={describedBy}
				aria-invalid={invalid || undefined}
				aria-label={label}
				autoFocus={autoFocus}
				className={cls}
				defaultValue={defaultValue}
				id={inputId}
				maxLength={maxLength}
				onBlur={onBlur}
				onChange={onChange}
				onFocus={onFocus}
				placeholder={placeholder}
				rows={minRows}
				style={maxRows ? assignInlineVars({ [styles.maxRowsVar]: String(maxRows) }) : undefined}
				value={value}
			/>
		);
	}

	return (
		<input
			aria-describedby={describedBy}
			aria-invalid={invalid || undefined}
			aria-label={label}
			autoCapitalize={autoCapitalize}
			autoComplete={autoComplete}
			autoFocus={autoFocus}
			className={cls}
			defaultValue={defaultValue}
			id={inputId}
			maxLength={maxLength}
			onBlur={onBlur}
			onChange={onChange}
			onFocus={onFocus}
			onKeyDown={onKeyDown}
			placeholder={placeholder}
			ref={inputRef}
			type="text"
			value={value}
		/>
	);
}
