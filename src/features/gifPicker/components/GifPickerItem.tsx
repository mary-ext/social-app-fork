import type { Gif } from '#/lib/media/external-gif/types';

import * as styles from '#/features/gifPicker/components/GifPickerItem.css';
import { gifPreviewUrl } from '#/features/gifPicker/utils';

import { m } from '#/paraglide/messages';

export function GifPickerItem({
	gif,
	onSelectGif,
	shape = 'intrinsic',
}: {
	gif: Gif;
	onSelectGif: (gif: Gif) => void;
	/** `square` crops the preview to fill a square tile. */
	shape?: 'intrinsic' | 'square';
}) {
	let aspectRatio = 1;
	if (shape === 'intrinsic') {
		const [width, height] = gif.media_formats.tinygif.dims;
		if (width > 0 && height > 0) {
			aspectRatio = width / height;
		}
	}

	return (
		<button
			type="button"
			className={styles.tile}
			onClick={() => onSelectGif(gif)}
			aria-label={m['features.gifPicker.gallery.select']({ title: gif.title })}
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
