// pixel widths/sizes shared between LeftNav.tsx and LeftNav.css.ts — a `.css.ts` can't import them from the
// `.tsx` without forming an import cycle (the `.tsx` imports the `.css.ts`).

/** Footprint of the avatar / compose button in the minimal rail. */
export const LARGE_ELEMENT_SIZE = 48;

/** Rendered width of a nav icon; wider than its 24px box so it overflows centered. */
export const NAV_ICON_WIDTH = 28;

export const LEFT_NAV_MINIMAL_WIDTH = 80;
export const LEFT_NAV_PWI_WIDTH = 245;
export const LEFT_NAV_STANDARD_WIDTH = 240;
