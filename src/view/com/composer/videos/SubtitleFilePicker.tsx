import { useRef } from 'react';
import { View } from 'react-native';

import { logger } from '#/logger';

import { atoms as a } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { CC_Stroke2_Corner0_Rounded as CCIcon } from '#/components/icons/CC';
import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';

export function SubtitleFilePicker({
	onSelectFile,
	disabled,
}: {
	onSelectFile: (file: File) => void;
	disabled?: boolean;
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
				// HACK: sometimes the mime type is just straight-up missing
				// best we can do is check the file extension and hope for the best
				selectedFile.name.endsWith('.vtt')
			) {
				onSelectFile(selectedFile);
			} else {
				logger.error('Invalid subtitle file type', {
					safeMessage: `File: ${selectedFile.name} (${selectedFile.type})`,
				});
				Toast.show(m['view.composer.captions.error.vttOnly']());
			}
		}
	};

	return (
		<View style={a.gap_lg}>
			<input
				type="file"
				accept=".vtt"
				ref={ref}
				style={a.hidden}
				onChange={handlePick}
				disabled={disabled}
				aria-disabled={disabled}
			/>
			<View style={a.flex_row}>
				<Button
					onPress={handleClick}
					label={m['view.composer.captions.action.select']()}
					size="large"
					color="primary"
					variant="solid"
					disabled={disabled}
				>
					<ButtonIcon icon={CCIcon} />
					<ButtonText>{m['view.composer.captions.action.select']()}</ButtonText>
				</Button>
			</View>
		</View>
	);
}
