import { useMemo } from 'react';

import { useCleanError } from '#/lib/hooks/useCleanError';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as RetryIcon } from '#/components/icons/ArrowRotate';
import * as Layout from '#/components/Layout';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';

import * as css from './ThreadError.css';

export function ThreadError({ error, onRetry }: { error: Error; onRetry: () => void }) {
	const cleanError = useCleanError();

	const { title, message } = useMemo(() => {
		let title = m['screens.postThread.post.error.load']();
		let message: string = m['screens.postThread.post.error.generic']();

		const { raw, clean } = cleanError(error);

		if (error.message.startsWith('Post not found')) {
			title = m['screens.postThread.post.error.notFound']();
			message = clean || raw || message;
		}

		return { title, message };
	}, [error, cleanError]);

	return (
		<Layout.Center>
			<div className={css.outer}>
				<div className={css.inner}>
					<div className={css.textGroup}>
						<Text align="center" size="lg" weight="semiBold">
							{title}
						</Text>
						<Text align="center" size="sm" color="textContrastMedium">
							{message}
						</Text>
					</div>
					<Button
						label={m['common.action.retry']()}
						size="small"
						variant="solid"
						color="secondary_inverted"
						onPress={onRetry}
					>
						<ButtonText>{m['common.action.retry']()}</ButtonText>
						<ButtonIcon icon={RetryIcon} position="right" />
					</Button>
				</div>
			</div>
		</Layout.Center>
	);
}
