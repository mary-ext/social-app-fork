import type { StyleRule } from '@vanilla-extract/css';

/**
 * wraps a style rule in a cascade layer.
 *
 * @param name layer name
 * @param rule style rule
 * @returns the layered rule
 */
export const layered = (name: string, rule: StyleRule): StyleRule => ({ '@layer': { [name]: rule } });
