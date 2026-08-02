import type { ReactNode } from 'react';

import { Text } from '#/components/Text';
import { Button, ButtonIcon } from '#/components/web/Button';

import CircleInfoIcon from '#/icons/central/CircleInfo_round_outlined_radius1_stroke2.svg';
import XIcon from '#/icons/central/CrossLarge_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as styles from './ComposerError.css';

/**
 * wraps a stack of {@link Box} error callouts, owning their shared outer padding and spacing. renders nothing
 * when it has no boxes.
 */
export function Root({ children }: { children: ReactNode }) {
	return <div className={styles.list}>{children}</div>;
}

/**
 * A single composer error callout: a filled contrast-25 box with a negative info icon; dismissible when
 * `onDismiss` is set.
 */
export function Box({
	error,
	detail,
	onDismiss,
}: {
	error: string;
	detail?: string;
	onDismiss?: () => void;
}) {
	return (
		<div className={styles.box}>
			<div className={styles.icon}>
				<CircleInfoIcon className={styles.circleInfoIcon} />
			</div>
			<div className={styles.column}>
				<Text>{error}</Text>

				{detail && (
					<Text color="textContrastMedium" size="sm">
						{detail}
					</Text>
				)}
			</div>
			{onDismiss && (
				<Button
					className={styles.dismiss}
					color="secondary"
					label={m['view.composer.a11y.dismissError']()}
					onClick={onDismiss}
					shape="round"
					size="tiny"
					variant="ghost"
				>
					<ButtonIcon icon={XIcon} />
				</Button>
			)}
		</div>
	);
}
