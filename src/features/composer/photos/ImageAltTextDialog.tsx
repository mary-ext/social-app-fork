import { type ReactNode, useId, useRef, useState } from 'react';

import { MAX_ALT_TEXT } from '#/lib/constants/composer';
import { useBreakpoints } from '#/lib/hooks/use-breakpoints';
import { getBlobUrl } from '#/lib/utils/blob-url';
import { trimText } from '#/lib/utils/text';

import * as Dialog from '#/components/Dialog';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import { CompactLayout } from './alt-text-dialog/CompactLayout';
import { WideLayout } from './alt-text-dialog/WideLayout';
import { AltTextAssistant } from './alt-text-generator/AltTextAssistant';
import type { AltTextContext } from './alt-text-generator/types';
import { useAltTextGenerator } from './alt-text-generator/use-generator';
import * as styles from './ImageAltTextDialog.css';

/** image data passed through the alt text dialog's handle. */
export type AltTextTarget = {
	/** post text and sibling alt text for description generation. */
	context: AltTextContext;
	blob: Blob;
	/** initial alt text; empty when absent. */
	alt: string;
};

type Props<T extends AltTextTarget> = {
	handle: Dialog.DialogHandle<T>;
	/** receives trimmed alt text and the opening payload on save. */
	onSave: (alt: string, target: T) => void;
};

export const ImageAltTextDialog = <T extends AltTextTarget>({ handle, onSave }: Props<T>): ReactNode => {
	const { gtMobile } = useBreakpoints();

	return (
		<Dialog.Root disablePointerDismissal handle={handle}>
			{({ payload }) => (
				<Dialog.Popup scroll="body" size={gtMobile ? 'xwide' : 'default'}>
					{payload && (
						<DialogInner
							target={payload}
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
	target: { context, blob, alt: initialAlt },
	onSave,
}: {
	target: AltTextTarget;
	onSave: (alt: string) => void;
}): ReactNode => {
	const { gtMobile } = useBreakpoints();
	const [alt, setAlt] = useState(initialAlt);
	const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
	const imageUrl = getBlobUrl(blob);
	const counterId = useId();

	const generator = useAltTextGenerator({
		blob,
		context: context,
		text: alt,
		onGenerated(draft) {
			const el = inputRef.current;
			if (!el) {
				return;
			}
			el.focus();
			el.setSelectionRange(0, el.value.length);
			document.execCommand('insertText', false, draft);
		},
	});

	const isOverLimit = alt.length > MAX_ALT_TEXT;
	const canSave = alt !== initialAlt && !isOverLimit;

	const counterLabel = isOverLimit
		? m['view.composer.altText.charCountOverLimit']({ length: alt.length, max: MAX_ALT_TEXT })
		: m['view.composer.altText.charCount']({ length: alt.length, max: MAX_ALT_TEXT });

	const save = () => {
		onSave(trimText(alt));
	};

	const Layout = gtMobile ? WideLayout : CompactLayout;

	return (
		<>
			<Dialog.Header.Root border>
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

			<Layout imageUrl={imageUrl}>
				<TextField.Root>
					<TextField.LabelText
						accessory={
							<Text
								aria-label={counterLabel}
								className={styles.counter}
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
						autoFocus
						describedBy={counterId}
						isInvalid={isOverLimit}
						label={m['common.altText.label']()}
						multiline
						onChangeText={setAlt}
						placeholder={m['common.altText.label']()}
						ref={inputRef}
						value={alt}
					/>
				</TextField.Root>

				{/* announce only the crossing into over-limit while typing; a stable message avoids per-keystroke spam */}
				<div className={styles.srOnly} role="status">
					{isOverLimit ? m['view.composer.altText.error.overLimit']() : ''}
				</div>

				<AltTextAssistant generator={generator} />
			</Layout>
		</>
	);
};
