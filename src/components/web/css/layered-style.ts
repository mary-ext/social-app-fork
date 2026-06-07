import { type StyleRule, style } from '@vanilla-extract/css';

import { components } from '#/styles/layers.css';

/**
 * Like vanilla-extract's `style`, but emits the rule into the `components` cascade layer so that an unlayered
 * `className` an instance passes through outranks the component style without a specificity bump (and the
 * global reset, being a lower layer, never clobbers it).
 *
 * @param rule the style rule to emit into the `components` layer
 * @param debugId optional identifier surfaced in the generated class name
 * @returns the generated class name
 */
export const layeredStyle = (rule: StyleRule, debugId?: string) =>
	style({ '@layer': { [components]: rule } }, debugId);
