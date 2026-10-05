import { type ReactNode, useRef, useState } from 'react';

import { useBreakpoints } from '#/lib/hooks/use-breakpoints';
import { getBlobUrl } from '#/lib/utils/blob-url';
import { trimText } from '#/lib/utils/text';

import { m } from '#/paraglide/messages';

import { AltTextField, AltTextHeader, canSaveAlt } from '../alt-text/AltTextField';
import { CompactLayout } from './alt-text-dialog/CompactLayout';
import { WideLayout } from './alt-text-dialog/WideLayout';
import { AltTextAssistant } from './alt-text-generator/AltTextAssistant';
import { useAltTextGenerator } from './alt-text-generator/use-generator';
import type { ImageAltTextTarget } from './ImageAltTextDialog';

/**
 * alt text editor with generated suggestions.
 *
 * @param props.target the image and its alt text when the dialog opened
 * @param props.onSave receives trimmed alt text
 * @returns the editor
 */
export const ImageAltTextDialogBody = ({
	target: { context, file, alt: initialAlt },
	onSave,
}: {
	target: ImageAltTextTarget;
	onSave: (alt: string) => void;
}): ReactNode => {
	const { gtMobile } = useBreakpoints();
	const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
	const [alt, setAlt] = useState(initialAlt);
	const imageUrl = getBlobUrl(file);

	const generator = useAltTextGenerator({
		file: file,
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

	const Layout = gtMobile ? WideLayout : CompactLayout;

	return (
		<>
			<AltTextHeader border canSave={canSaveAlt(alt, initialAlt)} onSave={() => onSave(trimText(alt))} />

			<Layout imageUrl={imageUrl}>
				<AltTextField
					// lazy loading can finish after the popup's initial focus.
					autoFocus
					alt={alt}
					inputRef={inputRef}
					onChangeAlt={setAlt}
					placeholder={m['common.altText.label']()}
				/>

				<AltTextAssistant generator={generator} />
			</Layout>
		</>
	);
};
