import { GifAltTextDialog } from '#/features/composer/GifAltTextDialog';
import type { Gif } from '#/features/gifPicker/types';

import * as Dialog from '#/components/Dialog';
import { Text } from '#/components/Text';
import { Admonition } from '#/components/web/Admonition';

import Check from '#/icons/central/Checkmark2_round_outlined_radius1_stroke2.svg';
import Plus from '#/icons/central/PlusSmall_round_outlined_radius1_stroke2.svg';
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
				{altText ? <Check className={styles.checkIcon} /> : <Plus className={styles.plusIcon} />}
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
