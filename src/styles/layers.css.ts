import { type StyleRule, layer } from '@vanilla-extract/css';

/**
 * cascade layer holding the global UA-default reset (see `reset.css.ts`). declared first so it sits below
 * {@link components}: the reset neutralizes browser defaults, and layered component styles still win over
 * it.
 */
export const reset = layer();

/**
 * cascade layer holding the web component library's own styling (primitives and recipe-generated variants).
 *
 * ordered after {@link reset} so the primitives beat the global reset, while instance overrides (being
 * unlayered) still beat the primitives.
 */
export const components = layer();

/**
 * wraps a style rule into the given cascade layer.
 *
 * @param name the cascade layer to emit the rule into (e.g. {@link components})
 * @param rule the style rule to wrap
 * @returns the style rule wrapped in an `@layer` block
 */
export const layered = (name: string, rule: StyleRule): StyleRule => ({ '@layer': { [name]: rule } });
