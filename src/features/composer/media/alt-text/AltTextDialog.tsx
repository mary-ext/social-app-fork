import { type ReactElement, type ReactNode, type RefObject, useRef, useState } from 'react';

import { trimText } from '#/lib/utils/text';

import * as Dialog from '#/components/Dialog';

import * as css from './AltTextDialog.css';
import { AltTextField, AltTextHeader, canSaveAlt } from './AltTextField';

/** initial values and media preview for an alt text dialog. */
export type AltTextView = {
	/** starting value; saving is disabled until it changes. */
	initialAlt: string;
	/** shown while the field is empty. */
	placeholder: string;
	/** return null to omit the preview. */
	renderPreview: () => ReactElement | null;
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
	const preview = renderPreview();

	return (
		<>
			<AltTextHeader
				border={false}
				canSave={canSaveAlt(alt, initialAlt)}
				onSave={() => onSave(trimText(alt))}
			/>

			<Dialog.Body>
				{preview !== null && <div className={css.preview}>{preview}</div>}

				<div className={css.form}>
					<AltTextField
						alt={alt}
						inputRef={inputRef}
						maxRows={8}
						onChangeAlt={setAlt}
						placeholder={placeholder}
					/>
				</div>
			</Dialog.Body>
		</>
	);
};
