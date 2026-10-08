'use no memo'; // controlled input updates usually invalidate the generated caches

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
	useState,
} from 'react';

import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import * as PasswordInputPrimitive from '#/components/primitives/password-input';
import { LabelText as BaseLabelText } from '#/components/Text';
import * as styles from '#/components/TextField.css';
import { Button, ButtonIcon } from '#/components/web/Button';

import EyeOpenIcon from '#/icons/central/EyeOpen_round_outlined_radius1_stroke2.svg';
import EyeSlashIcon from '#/icons/central/EyeSlash_round_outlined_radius1_stroke2.svg';

type FieldContextValue = {
	/** Generated id linking a field's {@link LabelText} to its {@link Input}; `undefined` outside a {@link Root}. */
	id: string | undefined;
	isInvalid: boolean;
};

const FieldContext = createContext<FieldContextValue>({ id: undefined, isInvalid: false });

/**
 * groups a field's label and input, sharing a generated id so the {@link LabelText} is associated with the
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
}: {
	/**
	 * Optional content rendered to the trailing edge of the label, as a sibling of the `<label>` so it stays
	 * out of the field's accessible name.
	 */
	accessory?: ReactNode;
	children: ReactNode;
}) {
	const { id } = useContext(FieldContext);
	const label = (
		<BaseLabelText
			htmlFor={id}
			className={accessory === undefined ? styles.label : undefined}
			size="md_sub"
			weight="medium"
			color="textContrastMedium"
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
	/** The rendered element: a `<textarea>` when `multiline`, an `<input>` otherwise. */
	ref?: Ref<HTMLInputElement & HTMLTextAreaElement>;
	className?: string;
	/** Accessible name. */
	label: string;
	/** Id of an element describing the field, wired to `aria-describedby` (e.g. a character counter or hint). */
	describedBy?: string;
	value?: string;
	defaultValue?: string;
	placeholder?: string;
	multiline?: boolean;
	/** Initial (and minimum) row count for a `multiline` input; it grows from here. */
	minRows?: number;
	/** Caps the autosizing height of a `multiline` input; further lines scroll within it. */
	maxRows?: number;
	/** Caps the number of characters accepted. */
	maxLength?: number;
	autoFocus?: boolean;
	disabled?: boolean;
	readOnly?: boolean;
	isInvalid?: boolean;
	/** Autofill hint for the single-line `<input>` (e.g. `url`). */
	autoComplete?: ComponentPropsWithoutRef<'input'>['autoComplete'];
	/** Auto-capitalization behaviour for the single-line `<input>`. */
	autoCapitalize?: ComponentPropsWithoutRef<'input'>['autoCapitalize'];
	onChangeText?: (value: string) => void;
	onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
	onFocus?: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
	onBlur?: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
};

export function Input({
	ref,
	className,
	label,
	describedBy,
	value,
	defaultValue,
	placeholder,
	multiline = false,
	minRows,
	maxRows,
	maxLength,
	autoFocus,
	disabled,
	readOnly,
	isInvalid,
	autoComplete,
	autoCapitalize,
	onChangeText,
	onKeyDown,
	onFocus,
	onBlur,
}: InputProps) {
	const { id: ctxId, isInvalid: ctxInvalid } = useContext(FieldContext);
	const invalid = isInvalid ?? ctxInvalid;
	const inputId = ctxId;
	const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
		onChangeText?.(e.currentTarget.value);
	const cls = clsx(styles.input, multiline && styles.multiline, invalid && styles.invalid, className);

	if (multiline) {
		return (
			<textarea
				ref={ref}
				id={inputId}
				className={cls}
				style={maxRows ? assignInlineVars({ [styles.maxRowsVar]: String(maxRows) }) : undefined}
				aria-label={label}
				aria-describedby={describedBy}
				aria-invalid={invalid || undefined}
				value={value}
				defaultValue={defaultValue}
				placeholder={placeholder}
				rows={minRows}
				maxLength={maxLength}
				autoFocus={autoFocus}
				disabled={disabled}
				readOnly={readOnly}
				onChange={onChange}
				onFocus={onFocus}
				onBlur={onBlur}
			/>
		);
	}

	return (
		<input
			ref={ref}
			id={inputId}
			type="text"
			className={cls}
			aria-label={label}
			aria-describedby={describedBy}
			aria-invalid={invalid || undefined}
			value={value}
			defaultValue={defaultValue}
			placeholder={placeholder}
			maxLength={maxLength}
			autoFocus={autoFocus}
			disabled={disabled}
			readOnly={readOnly}
			autoComplete={autoComplete}
			autoCapitalize={autoCapitalize}
			onChange={onChange}
			onKeyDown={onKeyDown}
			onFocus={onFocus}
			onBlur={onBlur}
		/>
	);
}

export type PasswordInputProps = Pick<
	InputProps,
	| 'autoComplete'
	| 'autoFocus'
	| 'defaultValue'
	| 'describedBy'
	| 'disabled'
	| 'isInvalid'
	| 'label'
	| 'onChangeText'
	| 'placeholder'
	| 'value'
> & {
	ref?: Ref<HTMLInputElement>;
	/** fixed accessible name for the reveal button, e.g. "Show API key". */
	revealLabel: string;
	/** requests a password-manager opt-out. */
	ignorePasswordManagers?: boolean;
};

/**
 * a password field with a visibility toggle.
 *
 * @param props field and toggle props
 * @returns the field
 */
export function PasswordInput({
	ref,
	label,
	revealLabel,
	describedBy,
	value,
	defaultValue,
	placeholder,
	autoFocus,
	disabled,
	isInvalid,
	autoComplete,
	ignorePasswordManagers,
	onChangeText,
}: PasswordInputProps) {
	const { id, isInvalid: ctxInvalid } = useContext(FieldContext);
	const invalid = isInvalid ?? ctxInvalid;
	const [visible, setVisible] = useState(false);

	return (
		<PasswordInputPrimitive.Root
			className={styles.passwordRoot}
			disabled={disabled}
			id={id}
			onVisibleChange={setVisible}
			visible={visible}
		>
			<PasswordInputPrimitive.Input
				ref={ref}
				className={clsx(styles.input, styles.passwordInput, invalid && styles.invalid)}
				aria-label={label}
				aria-describedby={describedBy}
				aria-invalid={invalid || undefined}
				value={value}
				defaultValue={defaultValue}
				placeholder={placeholder}
				autoFocus={autoFocus}
				autoComplete={autoComplete}
				ignorePasswordManagers={ignorePasswordManagers}
				onChange={(e) => onChangeText?.(e.currentTarget.value)}
			/>
			<PasswordInputPrimitive.Toggle
				render={
					<Button
						className={styles.passwordToggle}
						color="secondary"
						label={revealLabel}
						shape="round"
						size="small"
						variant="ghost"
					>
						<ButtonIcon icon={visible ? EyeSlashIcon : EyeOpenIcon} />
					</Button>
				}
			/>
		</PasswordInputPrimitive.Root>
	);
}
