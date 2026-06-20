import { useMediaQuery } from '#/lib/media-query';

/** @deprecated use `useBreakpoints` from `#/alf` instead */
export function useWebMediaQueries() {
	const isDesktop = useMediaQuery('(width >= 1300px)');
	const isTablet = useMediaQuery('(800px <= width < 1300px)');
	const isMobile = useMediaQuery('(width < 800px)');
	const isTabletOrMobile = isMobile || isTablet;
	const isTabletOrDesktop = isDesktop || isTablet;
	return { isMobile, isTablet, isTabletOrMobile, isTabletOrDesktop, isDesktop };
}
