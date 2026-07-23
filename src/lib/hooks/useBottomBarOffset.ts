import { useBreakpoints } from '#/lib/hooks/use-breakpoints';
import { useSafeAreaInsets } from '#/lib/hooks/use-safe-area';
import { clamp } from '#/lib/numbers';

export function useBottomBarOffset(modifier: number = 0) {
	const { gtMobile } = useBreakpoints();
	const { bottom: bottomInset } = useSafeAreaInsets();
	return (gtMobile ? 0 : clamp(60 + bottomInset, 60, 75)) + modifier;
}
