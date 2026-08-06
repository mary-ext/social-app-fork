import { useId, useRef, useState } from 'react';

import { useBlobUrl } from '#/lib/blob-url';
import { MAX_ALT_TEXT } from '#/lib/constants';
import { useBreakpoints } from '#/lib/hooks/use-breakpoints';
import type { ComposerImage } from '#/lib/media/composer-image';
import { trimText } from '#/lib/strings/helpers';

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

type Props = {
	/** The post this image is attached to, for the description assistant to anchor what it can't see to. */
	context: AltTextContext;
	handle: Dialog.DialogHandle;
	image: ComposerImage;
	onChange: (next: ComposerImage) => void;
};

export const ImageAltTextDialog = ({ context, handle, image, onChange }: Props): React.ReactNode => {
	const { gtMobile } = useBreakpoints();

	return (
		<Dialog.Root disablePointerDismissal handle={handle}>
			<Dialog.Popup scroll="body" size={gtMobile ? 'xwide' : 'default'}>
				<DialogInner context={context} handle={handle} image={image} onChange={onChange} />
			</Dialog.Popup>
		</Dialog.Root>
	);
};

const DialogInner = ({ context, handle, image, onChange }: Props): React.ReactNode => {
	const { gtMobile } = useBreakpoints();
	const [alt, setAlt] = useState(image.alt);
	const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
	const source = image.transformed ?? image.source;
	const imageUrl = useBlobUrl(source.blob);
	const counterId = useId();

	const generator = useAltTextGenerator({
		blob: source.blob,
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
	const canSave = alt !== image.alt && !isOverLimit;

	const counterLabel = isOverLimit
		? m['view.composer.altText.charCountOverLimit']({ length: alt.length, max: MAX_ALT_TEXT })
		: m['view.composer.altText.charCount']({ length: alt.length, max: MAX_ALT_TEXT });

	const onSave = () => {
		onChange({ ...image, alt: trimText(alt) });
		handle.close();
	};

	const Layout = gtMobile ? WideLayout : CompactLayout;

	return (
		<>
			<Dialog.Header.Outer>
				<Dialog.Header.Slot>
					<Button
						color="primary"
						label={m['common.action.cancel']()}
						onClick={() => handle.close()}
						size="small"
						variant="ghost"
					>
						<ButtonText size="md">{m['common.action.cancel']()}</ButtonText>
					</Button>
				</Dialog.Header.Slot>
				<Dialog.Header.Content>
					<Dialog.Header.TitleText>{m['view.composer.altText.action.add']()}</Dialog.Header.TitleText>
				</Dialog.Header.Content>
				<Dialog.Header.Slot>
					<Button
						className={canSave ? undefined : styles.inactiveSave}
						color="primary"
						disabled={!canSave}
						label={m['common.action.save']()}
						onClick={onSave}
						size="small"
						variant="ghost"
					>
						<ButtonText size="md">{m['common.action.save']()}</ButtonText>
					</Button>
				</Dialog.Header.Slot>
			</Dialog.Header.Outer>

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
