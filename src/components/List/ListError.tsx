import { Error } from '#/components/Error';

import { m } from '#/paraglide/messages';

/**
 * renders an initial list error.
 *
 * @param hideBackButton whether to hide the back button
 * @param message error message
 * @param onRetry retry handler
 * @param title error title
 * @returns the error state
 */
export function ListError({
	hideBackButton,
	message,
	onRetry,
	title,
}: {
	hideBackButton?: boolean;
	message: string;
	onRetry?: () => void;
	title?: string;
}) {
	return (
		<Error
			hideBackButton={hideBackButton}
			message={message}
			onRetry={onRetry}
			title={title ?? m['common.error.oops']()}
		/>
	);
}
