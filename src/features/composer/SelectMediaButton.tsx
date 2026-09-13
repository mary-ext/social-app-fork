import { openMediaPicker } from '#/lib/media/picker';

import { MAX_GALLERY_IMAGES } from '#/features/composer/state/composer';

import ImageIcon from '#/icons/central/Images1_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { ComposerToolbarButton } from './ComposerToolbarButton';

export type SelectMediaButtonProps = {
	disabled?: boolean;
	/** not called when the picker is dismissed */
	onSelectFiles: (files: File[]) => void;
};

export function SelectMediaButton({ disabled, onSelectFiles }: SelectMediaButtonProps) {
	const onPressSelectMedia = async () => {
		const files = await openMediaPicker();
		if (files.length === 0) {
			return;
		}
		onSelectFiles(files);
	};

	return (
		<ComposerToolbarButton
			icon={ImageIcon}
			onClick={() => void onPressSelectMedia()}
			label={m['view.composer.media.a11y.add']()}
			aria-description={m['view.composer.media.a11y.addHint']({ max: MAX_GALLERY_IMAGES })}
			disabled={disabled}
		/>
	);
}
