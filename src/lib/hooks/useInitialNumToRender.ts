import { useSafeAreaInsets } from '#/lib/hooks/use-safe-area';
import { useBottomBarOffset } from '#/lib/hooks/useBottomBarOffset';
import { useViewportSize } from '#/lib/viewport';

const MIN_POST_HEIGHT = 100;

export function useInitialNumToRender({
	minItemHeight = MIN_POST_HEIGHT,
	screenHeightOffset = 0,
}: { minItemHeight?: number; screenHeightOffset?: number } = {}) {
	const { height: screenHeight } = useViewportSize();
	const { top: topInset } = useSafeAreaInsets();
	const bottomBarHeight = useBottomBarOffset();

	const finalHeight = screenHeight - screenHeightOffset - topInset - bottomBarHeight;

	const minItems = Math.floor(finalHeight / minItemHeight);
	if (minItems < 1) {
		return 1;
	}
	return minItems;
}
