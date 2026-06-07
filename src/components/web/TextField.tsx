import { type ChangeEvent, createContext, type ReactNode, useContext, useId, useMemo } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

import { cx } from '#/components/web/cx';
import * as styles from '#/components/web/TextField.css';

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
export function Root({ isInvalid = false, children }: { isInvalid?: boolean; children: ReactNode }) {
	const id = useId();
	const value = useMemo(() => ({ id, isInvalid }), [id, isInvalid]);
	return <FieldContext.Provider value={value}>{children}</FieldContext.Provider>;
}

export function LabelText({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
	const { id } = useContext(FieldContext);
	// renders a semantic web <label>, not RN <Text> — the unwrapped-text rule doesn't model this
	// eslint-disable-next-line bsky-internal/avoid-unwrapped-text
	return (
		<label className={styles.label} htmlFor={htmlFor ?? id}>
			{children}
		</label>
	);
}

export type InputProps = {
	/** Accessible name. */
	label: string;
	value?: string;
	defaultValue?: string;
	onChangeText?: (value: string) => void;
	placeholder?: string;
	isInvalid?: boolean;
	multiline?: boolean;
	id?: string;
	className?: string;
};

export function Input({
	label,
	value,
	defaultValue,
	onChangeText,
	placeholder,
	isInvalid,
	multiline = false,
	id,
	className,
}: InputProps) {
	const { id: ctxId, isInvalid: ctxInvalid } = useContext(FieldContext);
	const invalid = isInvalid ?? ctxInvalid;
	const inputId = id ?? ctxId;
	const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
		onChangeText?.(e.currentTarget.value);
	const cls = cx(styles.input, multiline && styles.multiline, invalid && styles.invalid, className);

	if (multiline) {
		return (
			<TextareaAutosize
				aria-label={label}
				className={cls}
				defaultValue={defaultValue}
				id={inputId}
				onChange={onChange}
				placeholder={placeholder}
				value={value}
			/>
		);
	}

	return (
		<input
			aria-label={label}
			className={cls}
			defaultValue={defaultValue}
			id={inputId}
			onChange={onChange}
			placeholder={placeholder}
			type="text"
			value={value}
		/>
	);
}
