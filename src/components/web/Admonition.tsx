import type { ReactNode } from 'react';

import { clsx } from 'clsx';

import { Text } from '#/components/Text';
import * as styles from '#/components/web/Admonition.css';

import CircleInfoIcon from '#/icons/central/CircleInfo_round_outlined_radius1_stroke2.svg';
import CircleXIcon from '#/icons/central/CircleX_round_outlined_radius1_stroke2.svg';
import EmojiSadIcon from '#/icons/central/EmojiSad_round_outlined_radius1_stroke2.svg';
import WarningIcon from '#/icons/central/ExclamationTriangle_round_outlined_radius1_stroke2.svg';

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
		<div className={clsx(styles.outer({ type }), className)}>
			<div className={styles.row}>
				<Icon className={styles.iconWrap[type]} />
				<div className={styles.content}>
					<Text>{children}</Text>
				</div>
			</div>
		</div>
	);
}
