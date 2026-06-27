import { useMediaQuery } from '#/lib/media-query';

export type Breakpoint = 'gtPhone' | 'gtMobile' | 'gtTablet';

export function useBreakpoints(): Record<Breakpoint, boolean> & {
	activeBreakpoint: Breakpoint | undefined;
} {
	const gtPhone = useMediaQuery('(width >= 500px)');
	const gtMobile = useMediaQuery('(width >= 800px)');
	const gtTablet = useMediaQuery('(width >= 1300px)');
	let active: Breakpoint | undefined;
	if (gtTablet) {
		active = 'gtTablet';
	} else if (gtMobile) {
		active = 'gtMobile';
	} else if (gtPhone) {
		active = 'gtPhone';
	}
	return {
		activeBreakpoint: active,
		gtPhone,
		gtMobile,
		gtTablet,
	};
}

/** Fine-tuned breakpoints for the shell layout */
export function useLayoutBreakpoints() {
	const rightNavVisible = useMediaQuery('(width >= 1100px)');
	const centerColumnOffset = useMediaQuery('(1100px <= width <= 1300px)');
	const leftNavMinimal = useMediaQuery('(width <= 1300px)');

	return {
		rightNavVisible,
		centerColumnOffset,
		leftNavMinimal,
	};
}
