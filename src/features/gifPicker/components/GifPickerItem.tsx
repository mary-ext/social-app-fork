import { useLingui } from '@lingui/react/macro';

import * as styles from '#/features/gifPicker/components/GifPickerItem.css';
import type { Gif } from '#/features/gifPicker/types';
import { gifPreviewUrl } from '#/features/gifPicker/utils';

export function GifPickerItem({ gif, onSelectGif }: { gif: Gif; onSelectGif: (gif: Gif) => void }) {
	const { t: l } = useLingui();

	const [width, height] = gif.media_formats.tinygif.dims;
	const aspectRatio = width > 0 && height > 0 ? width / height : 1;

	return (
		<button
			type="button"
			className={styles.tile}
			onClick={() => onSelectGif(gif)}
			aria-label={l({
				message: `Select GIF "${gif.title}"`,
				comment:
					'Accessibility label for an individual GIF tile in the picker grid. The placeholder is the GIF’s title from the provider.',
			})}
		>
			<img
				className={styles.image}
				src={gifPreviewUrl(gif.media_formats.tinygif.url)}
				alt={gif.title}
				loading="lazy"
				style={{ aspectRatio: String(aspectRatio) }}
			/>
		</button>
	);
}
