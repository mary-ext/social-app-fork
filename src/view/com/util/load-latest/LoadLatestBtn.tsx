import { assignInlineVars } from '@vanilla-extract/dynamic';
import { clsx } from 'clsx';

import { useSafeAreaInsets } from '#/lib/hooks/use-safe-area';
import { useWebMediaQueries } from '#/lib/hooks/useWebMediaQueries';
import { useMediaQuery } from '#/lib/media-query';
import { clamp } from '#/lib/numbers';

import { useSession } from '#/state/session';

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
	const { hasSession } = useSession();
	const { isDesktop, isTablet, isMobile, isTabletOrMobile } = useWebMediaQueries();
	const insets = useSafeAreaInsets();

	// move button inline if it starts overlapping the left nav
	const isTallViewport = useMediaQuery('(height >= 700px)');

	// Adjust height of the fab if we have a session only on mobile web. If we don't have a session, we want to adjust
	// it on both tablet and mobile since the shell shows the bottom bar there too.
	const showBottomBar = hasSession ? isMobile : isTabletOrMobile;

	const bottom = isTablet ? 50 : clamp(insets.bottom, 15, 60) + 15;

	return (
		<div
			className={clsx(
				css.outer,
				isDesktop && (isTallViewport ? css.leftOutOfLine : css.leftInline),
				isTablet && css.leftInline,
				showBottomBar && css.lifted,
			)}
			style={assignInlineVars({ [css.bottomVar]: `${bottom}px` })}
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
					size="md"
					fill={showIndicator ? colors.primary_500 : colors.textContrastMedium}
				/>
			</button>
		</div>
	);
}
