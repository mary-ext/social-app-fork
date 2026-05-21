/** File-picker helpers backed by a hidden `<input type="file">`. */

type PickFilesOptions = {
	accept: string;
	multiple: boolean;
};

/**
 * Opens the browser file picker and resolves with the selected files.
 *
 * @param opts accepted mime types and whether multiple files may be chosen
 * @returns the selected files, or an empty array if the picker was dismissed
 */
function pickFiles({ accept, multiple }: PickFilesOptions): Promise<File[]> {
	return new Promise((resolve) => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = accept;
		input.multiple = multiple;
		input.style.display = 'none';

		document.body.appendChild(input);

		let settled = false;
		const settle = (files: File[]) => {
			if (settled) {
				return;
			}
			settled = true;
			document.body.removeChild(input);
			resolve(files);
		};

		input.addEventListener('change', () => settle(Array.from(input.files ?? [])));
		// fires when the picker is dismissed without a selection
		input.addEventListener('cancel', () => settle([]));

		input.click();
	});
}

/**
 * Opens a file picker for images and videos, allowing multiple selections.
 *
 * @returns the selected files, or an empty array if the picker was dismissed
 */
export function openMediaPicker(): Promise<File[]> {
	return pickFiles({ accept: 'image/*,video/*', multiple: true });
}

/**
 * Opens a file picker for a single image.
 *
 * @returns the selected image, or undefined if the picker was dismissed
 */
export async function openImagePicker(): Promise<File | undefined> {
	const files = await pickFiles({ accept: 'image/*', multiple: false });
	return files[0];
}
