import { Keyboard } from 'react-native';

import { ComposerToolbarButton } from '#/view/com/composer/ComposerToolbarButton';

import { GifSquare_Stroke2_Corner0_Rounded as GifIcon } from '#/components/icons/Gif';
import * as Dialog from '#/components/web/Dialog';

import { GifPickerDialog } from '#/features/gifPicker/GifPickerDialog';
import type { Gif } from '#/features/gifPicker/types';
import { m } from '#/paraglide/messages';

type Props = {
	onClose?: () => void;
	onSelectGif: (gif: Gif) => void;
	disabled?: boolean;
};

export function SelectGifBtn({ onClose, onSelectGif, disabled }: Props) {
	const control = Dialog.useDialogHandle();

	return (
		<>
			<Dialog.Trigger
				handle={control}
				render={
					<ComposerToolbarButton
						icon={GifIcon}
						// the dialog open is owned by the Trigger; dismiss the soft keyboard alongside it.
						onClick={() => Keyboard.dismiss()}
						label={m['view.composer.a11y.selectGif']()}
						aria-description={m['view.composer.a11y.opensGifPicker']()}
						disabled={disabled}
					/>
				}
			/>
			<GifPickerDialog handle={control} onClose={onClose} onSelectGif={onSelectGif} />
		</>
	);
}
