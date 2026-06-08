import { type ComplexStyleRule, type StyleRule, layer, style } from '@vanilla-extract/css';

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

/**
 * Like vanilla-extract's `style`, but emits the rule into the {@link components} cascade layer so that an
 * unlayered `className` an instance passes through outranks the component style without a specificity bump
 * (and the global reset, being a lower layer, never clobbers it).
 *
 * Accepts the same array form as `style` for composition: string members (composed class references) pass
 * through untouched so they keep their own layer, while each object member is emitted into the `components`
 * layer.
 *
 * @param rule the style rule, or array of rules/class references, to emit into the `components` layer
 * @param debugId optional identifier surfaced in the generated class name
 * @returns the generated class name
 */
export const componentStyle = (rule: ComplexStyleRule, debugId?: string) => {
	const intoLayer = (rule: StyleRule): StyleRule => ({ '@layer': { [components]: rule } });
	return style(
		Array.isArray(rule)
			? rule.map((member) =>
					Array.isArray(member) || typeof member === 'string' ? member : intoLayer(member),
				)
			: intoLayer(rule),
		debugId,
	);
};
