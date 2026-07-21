import { Keyboard } from 'react-native';

import { ComposerToolbarButton } from '#/view/com/composer/ComposerToolbarButton';

import * as Dialog from '#/components/Dialog';
import { GifSquare_Stroke2_Corner0_Rounded as GifIcon } from '#/components/icons/Gif';

import { GifPickerDialog } from '#/features/gifPicker/GifPickerDialog';
import type { Gif } from '#/features/gifPicker/types';
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
						// the dialog open is owned by the Trigger; dismiss the soft keyboard alongside it.
						onClick={() => Keyboard.dismiss()}
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
