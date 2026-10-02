import { type ReactElement, type ReactNode, type RefObject, useId, useRef, useState } from 'react';

import { MAX_ALT_TEXT } from '#/lib/constants/composer';
import { trimText } from '#/lib/utils/text';

import * as Dialog from '#/components/Dialog';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import * as css from './AltTextDialog.css';

/** initial values and media preview for an alt text dialog. */
export type AltTextView = {
	/** starting value; saving is disabled until it changes. */
	initialAlt: string;
	/** shown while the field is empty. */
	placeholder: string;
	/** receives draft alt text; return null to omit the preview. */
	renderPreview: (alt: string) => ReactElement | null;
};

type TextInput = HTMLInputElement & HTMLTextAreaElement;

/**
 * edits attachment alt text with an optional media preview.
 *
 * @param props.handle opens the dialog with a payload
 * @param props.getView builds the initial values and preview from the payload
 * @param props.onSave receives trimmed alt text and the original payload
 * @returns the dialog
 */
export const AltTextDialog = <T extends object>({
	handle,
	getView,
	onSave,
}: {
	handle: Dialog.DialogHandle<T>;
	getView: (target: T) => AltTextView;
	onSave: (alt: string, target: T) => void;
}): ReactNode => {
	const inputRef = useRef<TextInput>(null);

	return (
		<Dialog.Root disablePointerDismissal handle={handle}>
			{({ payload }) => (
				<Dialog.Popup scroll="body" initialFocus={inputRef}>
					{payload && (
						<DialogInner
							{...getView(payload)}
							inputRef={inputRef}
							onSave={(alt) => {
								onSave(alt, payload);
								handle.close();
							}}
						/>
					)}
				</Dialog.Popup>
			)}
		</Dialog.Root>
	);
};

const DialogInner = ({
	inputRef,
	initialAlt,
	placeholder,
	renderPreview,
	onSave,
}: AltTextView & {
	inputRef: RefObject<TextInput | null>;
	onSave: (alt: string) => void;
}): ReactNode => {
	const [alt, setAlt] = useState(initialAlt);
	const counterId = useId();
	const preview = renderPreview(alt);

	const isOverLimit = alt.length > MAX_ALT_TEXT;
	const canSave = alt !== initialAlt && !isOverLimit;

	const counterLabel = isOverLimit
		? m['view.composer.altText.charCountOverLimit']({ length: alt.length, max: MAX_ALT_TEXT })
		: m['view.composer.altText.charCount']({ length: alt.length, max: MAX_ALT_TEXT });

	const save = () => {
		onSave(trimText(alt));
	};

	return (
		<>
			<Dialog.Header.Root>
				<Dialog.Header.Close />
				<Dialog.Header.Title>{m['view.composer.altText.action.add']()}</Dialog.Header.Title>
				<Dialog.Header.Actions>
					<Button
						color="primary"
						disabled={!canSave}
						label={m['common.action.save']()}
						onClick={save}
						size="small"
					>
						<ButtonText>{m['common.action.save']()}</ButtonText>
					</Button>
				</Dialog.Header.Actions>
			</Dialog.Header.Root>

			<Dialog.Body>
				{preview !== null && <div className={css.preview}>{preview}</div>}

				<div className={css.form}>
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
							describedBy={counterId}
							isInvalid={isOverLimit}
							label={m['common.altText.label']()}
							maxRows={8}
							multiline
							onChangeText={setAlt}
							placeholder={placeholder}
							ref={inputRef}
							value={alt}
						/>
					</TextField.Root>

					{/* keep the message stable to avoid announcing each keystroke. */}
					<div className={css.srOnly} role="status">
						{isOverLimit ? m['view.composer.altText.error.overLimit']() : ''}
					</div>
				</div>
			</Dialog.Body>
		</>
	);
};
