import { layer } from '@vanilla-extract/css';

/**
 * Cascade layer holding the web component library's own styling — primitives and recipe-generated variants.
 * Because unlayered declarations always outrank layered ones, any unlayered `className` an instance passes
 * through wins over the layered component style without needing a specificity bump.
 */
export const components = layer('components');
