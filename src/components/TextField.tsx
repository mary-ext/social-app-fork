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
	useMemo,
} from 'react';
import { clsx } from 'clsx';
import TextareaAutosize from 'react-textarea-autosize';

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
	const value = useMemo(() => ({ id, isInvalid }), [id, isInvalid]);
	return (
		<FieldContext.Provider value={value}>
			<div className={clsx(styles.root, className)}>{children}</div>
		</FieldContext.Provider>
	);
}

export function LabelText({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
	const { id } = useContext(FieldContext);
	return (
		<BaseLabelText
			className={styles.label}
			color="textContrastMedium"
			htmlFor={htmlFor ?? id}
			size="sm"
			weight="medium"
		>
			{children}
		</BaseLabelText>
	);
}

export type InputProps = {
	/** Accessible name. */
	label: string;
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
			<TextareaAutosize
				aria-label={label}
				autoFocus={autoFocus}
				className={cls}
				defaultValue={defaultValue}
				id={inputId}
				maxLength={maxLength}
				maxRows={maxRows}
				minRows={minRows}
				onBlur={onBlur}
				onChange={onChange}
				onFocus={onFocus}
				placeholder={placeholder}
				value={value}
			/>
		);
	}

	return (
		<input
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
