import { Trans, useLingui } from '@lingui/react/macro';

import { Button, ButtonText } from '#/components/web/Button';
import type * as Dialog from '#/components/web/Dialog';
import { Text } from '#/components/web/Text';

import * as styles from '#/features/gifPicker/components/GifPickerErrorBoundary.css';

export function GifPickerErrorBoundary({
	handle,
	details,
}: {
	handle: Dialog.DialogHandle;
	details?: string;
}) {
	const { t: l } = useLingui();

	return (
		<div className={styles.root}>
			<Text size="lg" weight="semiBold">
				{l({
					message: 'Oh no!',
					comment: 'Title of the error screen shown when the GIF picker crashes unexpectedly.',
				})}
			</Text>
			<Text size="sm" color="textContrastMedium">
				{l({
					message:
						'There was an unexpected issue in the application. Please let us know if this happened to you!',
					comment:
						'Body of the error screen shown when the GIF picker crashes unexpectedly. Encourages the user to report the issue.',
				})}
			</Text>
			{details && <pre className={styles.details}>{details}</pre>}
			<Button label={l`Close dialog`} size="large" color="primary" onClick={() => handle.close()}>
				<ButtonText>
					<Trans comment="Visible label of the button that dismisses the GIF picker error dialog.">
						Close
					</Trans>
				</ButtonText>
			</Button>
		</div>
	);
}
