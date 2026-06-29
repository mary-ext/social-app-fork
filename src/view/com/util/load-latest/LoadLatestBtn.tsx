import { clsx } from 'clsx';

import { useWebMediaQueries } from '#/lib/hooks/useWebMediaQueries';
import { useMediaQuery } from '#/lib/media-query';

import { ArrowTop_Stroke2_Corner0_Rounded as ArrowIcon } from '#/components/icons/Arrow';

import { colors } from '#/styles/colors';

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
	const { isDesktop, isTablet } = useWebMediaQueries();

	// move button inline if it starts overlapping the left nav
	const isTallViewport = useMediaQuery('(height >= 700px)');

	return (
		<div
			className={clsx(
				css.outer,
				isDesktop && (isTallViewport ? css.leftOutOfLine : css.leftInline),
				isTablet && css.leftInline,
			)}
		>
			<button
				aria-label={label}
				className={clsx(css.button, showIndicator && css.indicator)}
				onClick={onPress}
				type="button"
			>
				<div className={css.hover} />
				<ArrowIcon
					className={css.icon}
					size="lg"
					fill={showIndicator ? colors.primary_500 : colors.textContrastMedium}
				/>
			</button>
		</div>
	);
}
