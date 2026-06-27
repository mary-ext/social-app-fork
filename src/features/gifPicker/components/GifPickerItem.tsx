import * as styles from '#/features/gifPicker/components/GifPickerItem.css';
import type { Gif } from '#/features/gifPicker/types';
import { gifPreviewUrl } from '#/features/gifPicker/utils';
import { m } from '#/paraglide/messages';

export function GifPickerItem({ gif, onSelectGif }: { gif: Gif; onSelectGif: (gif: Gif) => void }) {
	const [width, height] = gif.media_formats.tinygif.dims;
	const aspectRatio = width > 0 && height > 0 ? width / height : 1;

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
