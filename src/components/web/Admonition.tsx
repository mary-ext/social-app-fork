import type { ReactNode } from 'react';

import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon } from '#/components/icons/CircleInfo';
import { CircleX_Stroke2_Corner0_Rounded as CircleXIcon } from '#/components/icons/CircleX';
import { EmojiSad_Stroke2_Corner0_Rounded as EmojiSadIcon } from '#/components/icons/Emoji';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import * as styles from '#/components/web/Admonition.css';
import { cx } from '#/components/web/cx';
import { Text } from '#/components/web/Text';

type AdmonitionType = 'apology' | 'error' | 'info' | 'tip' | 'warning';

const ICONS = {
	apology: EmojiSadIcon,
	error: CircleXIcon,
	info: CircleInfoIcon,
	tip: CircleInfoIcon,
	warning: WarningIcon,
};

export function Admonition({
	children,
	type = 'info',
	className,
}: {
	children: ReactNode;
	type?: AdmonitionType;
	className?: string;
}) {
	const Icon = ICONS[type];
	return (
		<div className={cx(styles.outer, styles.border[type], className)}>
			<div className={styles.row}>
				<span className={cx(styles.iconWrap, styles.iconColor[type])}>
					<Icon fill="currentColor" size="md" />
				</span>
				<div className={styles.content}>
					<Text size="sm" leading="snug">
						{children}
					</Text>
				</div>
			</div>
		</div>
	);
}
