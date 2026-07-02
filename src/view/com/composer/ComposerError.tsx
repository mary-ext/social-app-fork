import type { ReactNode } from 'react';

import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon } from '#/components/icons/CircleInfo';
import { TimesLarge_Stroke2_Corner0_Rounded as XIcon } from '#/components/icons/Times';
import { Text } from '#/components/Text';
import { Button, ButtonIcon } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

import * as styles from './ComposerError.css';

/**
 * Wraps a stack of {@link Box} error callouts, owning their shared outer padding and spacing. Renders nothing
 * when it has no boxes, so callers can drop conditional boxes straight in.
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
				<CircleInfoIcon fill="currentColor" size="md" />
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
