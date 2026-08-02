import { ComposerToolbarButton } from '#/features/composer/ComposerToolbarButton';
import { GifPickerDialog } from '#/features/gifPicker/GifPickerDialog';
import type { Gif } from '#/features/gifPicker/types';

import * as Dialog from '#/components/Dialog';

import GifIcon from '#/icons/central/GifSquare_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

type Props = {
	onSelectGif: (gif: Gif) => void;
	disabled?: boolean;
};

export function SelectGifBtn({ onSelectGif, disabled }: Props) {
	const handle = Dialog.useDialogHandle();

	return (
		<>
			<Dialog.Trigger
				handle={handle}
				render={
					<ComposerToolbarButton
						icon={GifIcon}
						label={m['view.composer.gif.a11y.select']()}
						aria-description={m['view.composer.gif.a11y.opensPicker']()}
						disabled={disabled}
					/>
				}
			/>
			<GifPickerDialog handle={handle} onSelectGif={onSelectGif} />
		</>
	);
}
