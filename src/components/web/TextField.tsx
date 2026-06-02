import { type ChangeEvent, createContext, type ReactNode, useContext } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

import { cx } from '#/components/web/cx';
import * as styles from '#/components/web/TextField.css';

const InvalidContext = createContext(false);

/** Groups a field's label + input, propagating the invalid state to the input. */
export function Root({ isInvalid = false, children }: { isInvalid?: boolean; children: ReactNode }) {
	return <InvalidContext.Provider value={isInvalid}>{children}</InvalidContext.Provider>;
}

export function LabelText({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
	return (
		<label className={styles.label} htmlFor={htmlFor}>
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
	const ctxInvalid = useContext(InvalidContext);
	const invalid = isInvalid ?? ctxInvalid;
	const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChangeText?.(e.currentTarget.value);
	const cls = cx(styles.input, multiline && styles.multiline, invalid && styles.invalid, className);

	if (multiline) {
		return (
			<TextareaAutosize
				aria-label={label}
				className={cls}
				defaultValue={defaultValue}
				id={id}
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
			id={id}
			onChange={onChange}
			placeholder={placeholder}
			type="text"
			value={value}
		/>
	);
}
