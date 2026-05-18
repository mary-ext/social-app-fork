import {useMediaQuery} from 'react-responsive'

/**
 * @deprecated use `useBreakpoints` from `#/alf` instead
 */
export function useWebMediaQueries() {
  const isDesktop = useMediaQuery({minWidth: 1300})
  const isTablet = useMediaQuery({minWidth: 800, maxWidth: 1300 - 1})
  const isMobile = useMediaQuery({maxWidth: 800 - 1})
  const isTabletOrMobile = isMobile || isTablet
  const isTabletOrDesktop = isDesktop || isTablet
  return {isMobile, isTablet, isTabletOrMobile, isTabletOrDesktop, isDesktop}
}
