import { GifAltTextDialog } from '#/view/com/composer/GifAltTextDialog';

import * as Dialog from '#/components/Dialog';
import { Check_Stroke2_Corner0_Rounded as Check } from '#/components/icons/Check';
import { PlusSmall_Stroke2_Corner0_Rounded as Plus } from '#/components/icons/Plus';
import { Text } from '#/components/Text';
import { Admonition } from '#/components/web/Admonition';

import type { Gif } from '#/features/gifPicker/types';
import { m } from '#/paraglide/messages';

import * as styles from './GifAltText.css';

type Props = {
	altText: string;
	gif: Gif;
	onSubmit: (alt: string) => void;
};

export function GifAltText({ altText, gif, onSubmit }: Props): React.ReactNode {
	const handle = Dialog.useDialogHandle();

	return (
		<>
			<Dialog.Trigger
				aria-label={m['view.composer.altText.action.add']()}
				handle={handle}
				className={styles.badge}
			>
				{altText ? <Check size="xs" fill="currentColor" /> : <Plus size="sm" fill="currentColor" />}
				<Text weight="semiBold" selectable={false}>
					{m['common.altText.badge']()}
				</Text>
			</Dialog.Trigger>

			<Admonition type="info" className={styles.admonition}>
				{m['view.composer.altText.hint']()}
			</Admonition>

			<GifAltTextDialog altText={altText} gif={gif} handle={handle} onSubmit={onSubmit} />
		</>
	);
}
