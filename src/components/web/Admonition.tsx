import type { ReactNode } from 'react';
import { clsx } from 'clsx';

import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon } from '#/components/icons/CircleInfo';
import { CircleX_Stroke2_Corner0_Rounded as CircleXIcon } from '#/components/icons/CircleX';
import { EmojiSad_Stroke2_Corner0_Rounded as EmojiSadIcon } from '#/components/icons/Emoji';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import { Text } from '#/components/Text';
import * as styles from '#/components/web/Admonition.css';

import { colors } from '#/styles/colors';

type AdmonitionType = 'apology' | 'error' | 'info' | 'tip' | 'warning';

const ICONS = {
	apology: EmojiSadIcon,
	error: CircleXIcon,
	info: CircleInfoIcon,
	tip: CircleInfoIcon,
	warning: WarningIcon,
};

const ICON_FILL: Record<AdmonitionType, string> = {
	apology: colors.textContrastMedium,
	error: colors.negative_500,
	info: colors.textContrastMedium,
	tip: colors.primary_500,
	warning: colors.yellow,
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
		<div className={clsx(styles.outer({ type }), className)}>
			<div className={styles.row}>
				<Icon className={styles.iconWrap} fill={ICON_FILL[type]} size="lg" />
				<div className={styles.content}>
					<Text>{children}</Text>
				</div>
			</div>
		</div>
	);
}
