import { useRef } from 'react';

import { CC_Stroke2_Corner0_Rounded as CCIcon } from '#/components/icons/CC';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import * as css from './SubtitleFilePicker.css';

export function SubtitleFilePicker({
	disabled,
	onSelectFile,
}: {
	disabled?: boolean;
	onSelectFile: (file: File) => void;
}) {
	const ref = useRef<HTMLInputElement>(null);

	const handleClick = () => {
		ref.current?.click();
	};

	const handlePick = (evt: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = evt.target.files?.[0];
		if (selectedFile) {
			if (
				selectedFile.type === 'text/vtt' ||
				// some files omit the MIME type.
				// best we can do is check the file extension and hope for the best
				selectedFile.name.endsWith('.vtt')
			) {
				onSelectFile(selectedFile);
			} else {
				Toast.show(m['view.composer.captions.error.vttOnly']());
			}
		}
	};

	return (
		<div className={css.row}>
			<input
				type="file"
				accept=".vtt"
				ref={ref}
				className={css.hiddenInput}
				onChange={handlePick}
				disabled={disabled}
				aria-disabled={disabled}
			/>
			<Button
				onClick={handleClick}
				label={m['view.composer.captions.action.select']()}
				size="large"
				color="primary"
				variant="solid"
				disabled={disabled}
			>
				<ButtonIcon icon={CCIcon} />
				<ButtonText>{m['view.composer.captions.action.select']()}</ButtonText>
			</Button>
		</div>
	);
}
