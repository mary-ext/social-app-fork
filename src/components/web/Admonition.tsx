import type { ReactNode } from 'react';
import { clsx } from 'clsx';

import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon } from '#/components/icons/CircleInfo';
import { CircleX_Stroke2_Corner0_Rounded as CircleXIcon } from '#/components/icons/CircleX';
import { EmojiSad_Stroke2_Corner0_Rounded as EmojiSadIcon } from '#/components/icons/Emoji';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import { Text } from '#/components/Text';
import * as styles from '#/components/web/Admonition.css';

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
		<div className={clsx(styles.outer, styles.border[type], className)}>
			<div className={styles.row}>
				<span className={clsx(styles.iconWrap, styles.iconColor[type])}>
					<Icon fill="currentColor" size="md" />
				</span>
				<div className={styles.content}>
					<Text>{children}</Text>
				</div>
			</div>
		</div>
	);
}
