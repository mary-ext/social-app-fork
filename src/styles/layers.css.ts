import { type StyleRule, layer } from '@vanilla-extract/css';

/**
 * Cascade layer holding the global UA-default reset (see `reset.css.ts`). Declared first so it sits below
 * {@link components}: the reset neutralizes browser defaults, and layered component styles still win over
 * it.
 */
export const reset = layer();

/**
 * Cascade layer holding the web component library's own styling — primitives and recipe-generated variants.
 * Because unlayered declarations always outrank layered ones, any unlayered `className` an instance passes
 * through wins over the layered component style without needing a specificity bump.
 *
 * Ordered after {@link reset} so the primitives beat the global reset (e.g. a button's `fontWeight` survives
 * the `font: inherit` reset) while instance overrides, being unlayered, still beat the primitives.
 */
export const components = layer();

/**
 * Wraps a style rule into the given cascade layer, so an unlayered `className` an instance passes through
 * outranks it without a specificity bump (and a lower layer like {@link reset} never clobbers it).
 *
 * Pass the result to `style` / `styleVariants` rather than calling `style` here, so vanilla-extract still
 * derives the debug id from the assigned variable name. Compose at the call site — `style([sharedClass,
 * layered(components, { ... })])` keeps `sharedClass`'s own layer while layering the inline rule.
 *
 * @param name the cascade layer to emit the rule into (e.g. {@link components})
 * @param rule the style rule to wrap
 * @returns a style rule wrapping `rule` in an `@layer` block
 */
export const layered = (name: string, rule: StyleRule): StyleRule => ({ '@layer': { [name]: rule } });
