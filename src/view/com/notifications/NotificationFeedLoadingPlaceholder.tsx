import { clsx } from 'clsx';

import { Heart2_Filled_Stroke2_Corner0_Rounded as HeartIconFilled } from '#/components/icons/Heart2';

import { colors } from '#/styles/colors';

import * as itemCss from './NotificationFeedItem.css';
import * as css from './NotificationFeedLoadingPlaceholder.css';

function NotificationLoadingPlaceholder({ topBorder }: { topBorder: boolean }) {
	return (
		<div className={clsx(css.item, topBorder && css.itemTopBorder)}>
			<div className={itemCss.iconColumn}>
				<HeartIconFilled size="lg" fill={colors.contrast_50} />
			</div>
			<div className={itemCss.content}>
				<div className={css.avatar} />
				<div className={css.textBlock}>
					<div className={clsx(css.line, css.lineWide)} />
					<div className={clsx(css.line, css.lineNarrow)} />
				</div>
			</div>
		</div>
	);
}

export function NotificationFeedLoadingPlaceholder() {
	return (
		<>
			{Array.from({ length: 11 }, (_, i) => (
				<NotificationLoadingPlaceholder key={i} topBorder={i !== 0} />
			))}
		</>
	);
}
