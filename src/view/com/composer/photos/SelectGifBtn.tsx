import { Keyboard } from 'react-native';
import { useLingui } from '@lingui/react/macro';

import { ComposerToolbarButton } from '#/view/com/composer/ComposerToolbarButton';

import { GifSquare_Stroke2_Corner0_Rounded as GifIcon } from '#/components/icons/Gif';
import * as Sheet from '#/components/web/Sheet';

import { GifPickerDialog } from '#/features/gifPicker/GifPickerDialog';
import type { Gif } from '#/features/gifPicker/types';

type Props = {
	onClose?: () => void;
	onSelectGif: (gif: Gif) => void;
	disabled?: boolean;
};

export function SelectGifBtn({ onClose, onSelectGif, disabled }: Props) {
	const { t: l } = useLingui();
	const control = Sheet.useSheetHandle();

	return (
		<>
			<Sheet.Trigger
				handle={control}
				render={
					<ComposerToolbarButton
						icon={GifIcon}
						// the dialog open is owned by the Trigger; dismiss the soft keyboard alongside it.
						onClick={() => Keyboard.dismiss()}
						label={l({
							message: 'Select GIF',
							comment:
								'Accessibility label for the button in the post composer that opens the GIF picker dialog.',
						})}
						aria-description={l({
							message: 'Opens the GIF picker dialog',
							comment:
								'Accessibility hint announced after the GIF picker button label, describing what activating it will do.',
						})}
						disabled={disabled}
					/>
				}
			/>
			<GifPickerDialog handle={control} onClose={onClose} onSelectGif={onSelectGif} />
		</>
	);
}
