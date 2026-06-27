import { type Breakpoint, useBreakpoints } from '#/alf/breakpoints';
import * as tokens from '#/alf/tokens';

type Gutter = 'compact' | 'base' | 'wide' | 0;

const gutters: Record<Exclude<Gutter, 0>, Record<Breakpoint | 'default', number>> = {
	compact: {
		default: tokens.space.sm,
		gtPhone: tokens.space.sm,
		gtMobile: tokens.space.md,
		gtTablet: tokens.space.md,
	},
	base: {
		default: tokens.space.lg,
		gtPhone: tokens.space.lg,
		gtMobile: tokens.space.xl,
		gtTablet: tokens.space.xl,
	},
	wide: {
		default: tokens.space.xl,
		gtPhone: tokens.space.xl,
		gtMobile: tokens.space._3xl,
		gtTablet: tokens.space._3xl,
	},
};

type Gutters = {
	paddingTop: number;
	paddingRight: number;
	paddingBottom: number;
	paddingLeft: number;
};

export function useGutters([all]: [Gutter]): Gutters;
export function useGutters([vertical, horizontal]: [Gutter, Gutter]): Gutters;
export function useGutters([top, right, bottom, left]: [Gutter, Gutter, Gutter, Gutter]): Gutters;
export function useGutters([topArg, rightArg, bottomArg, leftArg]: Gutter[]) {
	const { activeBreakpoint } = useBreakpoints();

	// CSS-shorthand-like spread: 1 value -> all sides; 2 -> vertical/horizontal; 4 -> each side.
	const top = topArg;
	const [right, bottom, left] =
		rightArg === undefined
			? [top, top, top]
			: bottomArg === undefined
				? [rightArg, top, rightArg]
				: [rightArg, bottomArg, leftArg];

	const breakpoint = activeBreakpoint || 'default';
	return {
		paddingTop: top === 0 ? 0 : gutters[top!][breakpoint],
		paddingRight: right === 0 ? 0 : gutters[right!][breakpoint],
		paddingBottom: bottom === 0 ? 0 : gutters[bottom!][breakpoint],
		paddingLeft: left === 0 ? 0 : gutters[left!][breakpoint],
	};
}
