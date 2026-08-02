import { clsx } from 'clsx';

import { useBreakpoints } from '#/lib/hooks/use-breakpoints';
import { useMediaQuery } from '#/lib/media-query';

import ArrowIcon from '#/icons/central/ArrowUp_round_outlined_radius1_stroke2.svg';

import * as css from './LoadLatestBtn.css';

export function LoadLatestBtn({
	onPress,
	label,
	showIndicator,
}: {
	onPress: () => void;
	label: string;
	showIndicator: boolean;
}) {
	const { gtMobile, gtTablet } = useBreakpoints();

	// move button inline if it starts overlapping the left nav
	const isTallViewport = useMediaQuery('(height >= 700px)');

	return (
		<div
			className={clsx(
				css.outer,
				gtTablet && (isTallViewport ? css.leftOutOfLine : css.leftInline),
				gtMobile && !gtTablet && css.leftInline,
			)}
		>
			<button
				aria-label={label}
				className={clsx(css.button, showIndicator && css.indicator)}
				onClick={onPress}
				type="button"
			>
				<div className={css.hover} />
				<ArrowIcon className={clsx(css.icon, showIndicator && css.iconIndicating)} />
			</button>
		</div>
	);
}
