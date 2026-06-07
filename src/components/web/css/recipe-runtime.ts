/**
 * Runtime half of the in-house recipe (see `./recipe`). The vanilla-extract function serializer rewrites a
 * recipe's `.css.ts` export into a `createRuntimeFn(config)` call importing from here, so the build-time
 * style machinery never reaches the client bundle — only this selector function and the precomputed class
 * names do.
 */

export type VariantValue = boolean | number | string;
type Selection = Record<string, VariantValue | undefined>;

/** Serialized recipe data produced at build time and embedded into the client bundle. */
export type RecipeConfig = {
	/** `[variantMatch, className]` pairs; a match value may be an array meaning "any of". */
	compoundVariants: [Record<string, VariantValue | VariantValue[]>, string][];
	/** Always-applied class(es), space-joined. */
	defaultClassName: string;
	defaultVariants: Selection;
	/** `variantName -> variantValue -> className`. Keys are stringified variant values. */
	variantClassNames: Record<string, Record<string, string>>;
};

export type RecipeFn = (props?: Selection) => string;

const matches = (expected: VariantValue | VariantValue[], actual: VariantValue | undefined): boolean => {
	if (Array.isArray(expected)) {
		return expected.some((value) => value === actual);
	}
	return expected === actual;
};

/**
 * Rebuilds a recipe's variant-selecting function from its serialized config.
 *
 * @param config build-time-extracted class names and variant metadata
 * @returns a function mapping a variant selection to the resolved class string
 */
export const createRuntimeFn = (config: RecipeConfig): RecipeFn => {
	return (props) => {
		const selections: Selection = { ...config.defaultVariants };
		if (props) {
			for (const name in props) {
				const value = props[name];
				if (value !== undefined) {
					selections[name] = value;
				}
			}
		}
		let className = config.defaultClassName;

		for (const name in config.variantClassNames) {
			const selected = selections[name];
			if (selected == null) {
				continue;
			}
			const variantClass = config.variantClassNames[name]?.[String(selected)];
			if (variantClass) {
				className += ' ' + variantClass;
			}
		}

		for (const [check, compoundClass] of config.compoundVariants) {
			let applies = true;
			for (const name in check) {
				const expected = check[name];
				if (expected !== undefined && !matches(expected, selections[name])) {
					applies = false;
					break;
				}
			}
			if (applies) {
				className += ' ' + compoundClass;
			}
		}

		return className;
	};
};
