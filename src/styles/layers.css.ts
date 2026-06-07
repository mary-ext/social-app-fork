import { layer } from '@vanilla-extract/css';

/**
 * Cascade layer holding the global UA-default reset (see `reset.css.ts`). Declared first so it sits below
 * {@link components}: the reset neutralizes browser defaults, and layered component styles still win over
 * it.
 */
export const reset = layer('reset');

/**
 * Cascade layer holding the web component library's own styling — primitives and recipe-generated variants.
 * Because unlayered declarations always outrank layered ones, any unlayered `className` an instance passes
 * through wins over the layered component style without needing a specificity bump.
 *
 * Ordered after {@link reset} so the primitives beat the global reset (e.g. a button's `fontWeight` survives
 * the `font: inherit` reset) while instance overrides, being unlayered, still beat the primitives.
 */
export const components = layer('components');
