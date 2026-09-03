import { Text } from '#/components/Text';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import * as css from './ErrorBoundaryFallback.css';

/**
 * displays an error boundary fallback.
 *
 * @param details error details
 * @param onClose closes the wrapped surface
 * @returns the fallback UI
 */
export function ErrorBoundaryFallback({ details, onClose }: { details?: string; onClose?: () => void }) {
	return (
		<div className={css.outer} role="alert">
			<Text size="lg" weight="semiBold">
				{m['common.error.ohNo']()}
			</Text>
			<Text color="textContrastMedium">{m['common.error.unexpected']()}</Text>

			{details && <pre className={css.details}>{details}</pre>}

			{onClose && (
				<Button
					color="primary"
					label={m['common.a11y.closeDialog']()}
					onClick={onClose}
					size="small"
					variant="solid"
				>
					<ButtonText>{m['common.action.close']()}</ButtonText>
				</Button>
			)}
		</div>
	);
}
