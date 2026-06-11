import { useMemo } from 'react';
import { useLingui, Trans } from '@lingui/react/macro';

import { useCleanError } from '#/lib/hooks/useCleanError';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { ArrowRotateCounterClockwise_Stroke2_Corner0_Rounded as RetryIcon } from '#/components/icons/ArrowRotate';
import * as Layout from '#/components/Layout';
import { Text } from '#/components/web/Text';

import * as css from './ThreadError.css';

export function ThreadError({ error, onRetry }: { error: Error; onRetry: () => void }) {
	const { t: l } = useLingui();
	const cleanError = useCleanError();

	const { title, message } = useMemo(() => {
		let title = l`Error loading post`;
		let message = l`Something went wrong. Please try again in a moment.`;

		const { raw, clean } = cleanError(error);

		if (error.message.startsWith('Post not found')) {
			title = l`Post not found`;
			message = clean || raw || message;
		}

		return { title, message };
	}, [l, error, cleanError]);

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
					<Button label={l`Retry`} size="small" variant="solid" color="secondary_inverted" onPress={onRetry}>
						<ButtonText>
							<Trans>Retry</Trans>
						</ButtonText>
						<ButtonIcon icon={RetryIcon} position="right" />
					</Button>
				</div>
			</div>
		</Layout.Center>
	);
}
