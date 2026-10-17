import { type ComplexStyleRule, style, styleVariants } from '@vanilla-extract/css';
import { addFunctionSerializer } from '@vanilla-extract/css/functionSerializer';

import {
	type RecipeConfig,
	type RecipeFn,
	type VariantValue,
	createRuntimeFn,
} from '#/styles/recipe-runtime';

// #region types

type VariantDefinitions = Record<string, ComplexStyleRule>;
type VariantGroups = Record<string, VariantDefinitions>;

/** Collapses `'true'`/`'false'` variant keys to `boolean`, mirroring cva's prop typing. */
type StringToBoolean<T> = T extends 'false' | 'true' ? boolean : T;

type VariantSelection<Variants extends VariantGroups> = {
	[Group in keyof Variants]?: StringToBoolean<keyof Variants[Group]>;
};

/**
 * A compound variant: matches when every listed variant equals (or, for an array, is among) the resolved
 * selection, then contributes `style`.
 */
type CompoundVariant<Variants extends VariantGroups> = {
	[Group in keyof Variants]?:
		| StringToBoolean<keyof Variants[Group]>
		| StringToBoolean<keyof Variants[Group]>[];
} & {
	style: ComplexStyleRule;
};

type RecipeDefinition<Variants extends VariantGroups> = {
	base?: ComplexStyleRule;
	compoundVariants?: CompoundVariant<Variants>[];
	defaultVariants?: VariantSelection<Variants>;
	variants?: Variants;
};

type RecipeOptions = {
	/** Name woven into generated class identifiers. */
	debugId?: string;
	/** Cascade layer to emit every generated style into; omit to leave them unlayered. */
	layer?: string;
};

type Resolve<T> = { [Key in keyof T]: T[Key] } & {};

/** The variant-selecting function a recipe returns. */
export type RecipeRuntimeFn<Variants extends VariantGroups> = (
	props?: Resolve<VariantSelection<Variants>>,
) => string;

/** Extracts a recipe's variant-props object type, for typing the props of a component built on it. */
export type RecipeVariants<Fn extends RecipeRuntimeFn<VariantGroups>> = Resolve<
	NonNullable<Parameters<Fn>[0]>
>;

// #endregion

const mapValues = <T, R>(input: Record<string, T>, fn: (value: T, key: string) => R): Record<string, R> => {
	const out: Record<string, R> = {};
	for (const [key, value] of Object.entries(input)) {
		out[key] = fn(value, key);
	}
	return out;
};

/**
 * builds a cva-style recipe with vanilla-extract where variants compile to classes and the returned function
 * resolves a selection to a class string.
 *
 * @param definition base style, variant groups, compound variants, and default variants
 * @param options options containing debugId and cascade layer
 * @returns a function mapping a variant selection to its resolved class string
 */
export const recipe = <Variants extends VariantGroups>(
	definition: RecipeDefinition<Variants>,
	options: RecipeOptions = {},
): RecipeRuntimeFn<Variants> => {
	const { debugId, layer } = options;
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- an omitted `variants` means no variant groups, i.e. the empty object
	const { base, compoundVariants = [], defaultVariants = {}, variants = {} as Variants } = definition;

	const layered = (rule: ComplexStyleRule): ComplexStyleRule => {
		if (layer == null) {
			return rule;
		}
		const rules = Array.isArray(rule) ? rule : [rule];
		// composed class names (string or nested string arrays) pass through unlayered — they keep their own
		// layer; only the inline style rules this recipe owns get wrapped.
		return rules.map((r) => (typeof r === 'object' && !Array.isArray(r) ? { '@layer': { [layer]: r } } : r));
	};

	const defaultClassName = base == null ? style({}, debugId) : style(layered(base), debugId);

	const variantClassNames = mapValues(variants, (group, groupName) => {
		return styleVariants(group, (rule) => layered(rule), debugId ? `${debugId}_${groupName}` : groupName);
	});

	const compounds = compoundVariants.map(
		({ style: rule, ...check }, index): [Record<string, VariantValue | VariantValue[]>, string] => {
			return [
				// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- everything left after `style` is a variant selection
				check as Record<string, VariantValue | VariantValue[]>,
				style(layered(rule), debugId ? `${debugId}_compound_${index}` : undefined),
			];
		},
	);

	const config: RecipeConfig = {
		compoundVariants: compounds,
		defaultClassName,
		defaultVariants: defaultVariants,
		variantClassNames,
	};

	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the serializer erases the variant-typed signature to `RecipeFn`
	return addFunctionSerializer<RecipeFn>(createRuntimeFn(config), {
		args: [config],
		importName: 'createRuntimeFn',
		importPath: '#/styles/recipe-runtime',
	}) as RecipeRuntimeFn<Variants>;
};
