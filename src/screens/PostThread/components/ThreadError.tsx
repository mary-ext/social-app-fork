import { useCleanError } from '#/lib/hooks/useCleanError';

import { ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as RetryIcon } from '#/components/icons/ArrowRotate';
import { Text } from '#/components/Text';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import * as css from './ThreadError.css';

export function ThreadError({ error, onRetry }: { error: Error; onRetry: () => void }) {
	const cleanError = useCleanError();

	let title = m['screens.postThread.post.error.load']();
	let message: string = m['screens.postThread.post.error.generic']();
	{
		const { raw, clean } = cleanError(error);

		if (error.message.startsWith('Post not found')) {
			title = m['screens.postThread.post.error.notFound']();
			message = clean || raw || message;
		}
	}

	return (
		<div className={css.outer}>
			<div className={css.inner}>
				<div className={css.textGroup}>
					<Text align="center" size="lg" weight="semiBold">
						{title}
					</Text>
					<Text align="center" size="md_sub" color="textContrastMedium">
						{message}
					</Text>
				</div>

				<Button
					label={m['common.action.retry']()}
					size="small"
					variant="solid"
					color="primary"
					onClick={onRetry}
				>
					<ButtonIcon icon={RetryIcon} />
					<ButtonText>{m['common.action.retry']()}</ButtonText>
				</Button>
			</div>
		</div>
	);
}
