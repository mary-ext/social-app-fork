import { Text } from '#/components/Text';
import { Button, ButtonText } from '#/components/web/Button';
import type * as Dialog from '#/components/web/Dialog';

import * as styles from '#/features/gifPicker/components/GifPickerErrorBoundary.css';
import { m } from '#/paraglide/messages';

export function GifPickerErrorBoundary({
	handle,
	details,
}: {
	handle: Dialog.DialogHandle;
	details?: string;
}) {
	return (
		<div className={styles.root}>
			<Text size="lg" weight="semiBold">
				{m['common.error.ohNo']()}
			</Text>
			<Text size="sm" color="textContrastMedium">
				{m['common.error.unexpected']()}
			</Text>
			{details && <pre className={styles.details}>{details}</pre>}
			<Button
				label={m['common.a11y.closeDialog']()}
				size="large"
				color="primary"
				onClick={() => handle.close()}
			>
				<ButtonText>{m['common.action.close']()}</ButtonText>
			</Button>
		</div>
	);
}
