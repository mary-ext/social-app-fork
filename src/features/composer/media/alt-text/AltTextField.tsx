import { type ReactNode, type Ref, useId } from 'react';

import { MAX_ALT_TEXT } from '#/lib/constants/composer';

import * as Dialog from '#/components/Dialog';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import * as css from './AltTextField.css';

/**
 * checks whether edited alt text can be saved.
 *
 * @param alt the current value
 * @param initialAlt the value when editing started
 * @returns true if the value changed and fits the limit
 */
export const canSaveAlt = (alt: string, initialAlt: string): boolean => {
	return alt !== initialAlt && alt.length <= MAX_ALT_TEXT;
};

/**
 * alt text dialog header with a save action.
 *
 * @param props.border whether to separate the header from the body
 * @param props.canSave enables the save action
 * @param props.onSave called when saving
 * @returns the header
 */
export const AltTextHeader = ({
	border,
	canSave,
	onSave,
}: {
	border: boolean;
	canSave: boolean;
	onSave: () => void;
}): ReactNode => {
	return (
		<Dialog.Header.Root border={border}>
			<Dialog.Header.Close />
			<Dialog.Header.Title>{m['view.composer.altText.action.add']()}</Dialog.Header.Title>
			<Dialog.Header.Actions>
				<Button
					color="primary"
					disabled={!canSave}
					label={m['common.action.save']()}
					onClick={onSave}
					size="small"
				>
					<ButtonText>{m['common.action.save']()}</ButtonText>
				</Button>
			</Dialog.Header.Actions>
		</Dialog.Header.Root>
	);
};

/**
 * alt text input with a length counter.
 *
 * @param props.alt the current value
 * @param props.onChangeAlt receives the edited value
 * @param props.placeholder shown while the field is empty
 * @param props.inputRef the underlying input
 * @param props.autoFocus focuses the input on mount
 * @param props.maxRows caps the input's growth
 * @returns the field
 */
export const AltTextField = ({
	alt,
	onChangeAlt,
	placeholder,
	inputRef,
	autoFocus,
	maxRows,
}: {
	alt: string;
	onChangeAlt: (alt: string) => void;
	placeholder: string;
	inputRef: Ref<HTMLInputElement & HTMLTextAreaElement>;
	autoFocus?: boolean;
	maxRows?: number;
}): ReactNode => {
	const counterId = useId();
	const isOverLimit = alt.length > MAX_ALT_TEXT;

	const counterLabel = isOverLimit
		? m['view.composer.altText.charCountOverLimit']({ length: alt.length, max: MAX_ALT_TEXT })
		: m['view.composer.altText.charCount']({ length: alt.length, max: MAX_ALT_TEXT });

	return (
		<>
			<TextField.Root>
				<TextField.LabelText
					accessory={
						<Text
							aria-label={counterLabel}
							className={css.counter}
							color={isOverLimit ? 'negative_500' : 'textContrastMedium'}
							id={counterId}
							size="sm"
						>
							{alt.length} / {MAX_ALT_TEXT}
						</Text>
					}
				>
					{m['view.composer.altText.descriptive']()}
				</TextField.LabelText>
				<TextField.Input
					autoFocus={autoFocus}
					describedBy={counterId}
					isInvalid={isOverLimit}
					label={m['common.altText.label']()}
					maxRows={maxRows}
					multiline
					onChangeText={onChangeAlt}
					placeholder={placeholder}
					ref={inputRef}
					value={alt}
				/>
			</TextField.Root>

			{/* keep the message stable to avoid announcing each keystroke. */}
			<div className={css.srOnly} role="status">
				{isOverLimit ? m['view.composer.altText.error.overLimit']() : ''}
			</div>
		</>
	);
};
