import { type ComplexStyleRule, type StyleRule, style, styleVariants } from '@vanilla-extract/css';
import { addFunctionSerializer } from '@vanilla-extract/css/functionSerializer';

import {
	type RecipeConfig,
	type RecipeFn,
	type VariantValue,
	createRuntimeFn,
} from '#/components/web/css/recipe-runtime';

import { components } from '#/styles/layers.css';

// #region types

/** A variant's payload: a style object (emitted into the `components` layer) or an existing class name. */
type RecipeStyleRule = StyleRule | string;
type VariantDefinitions = Record<string, RecipeStyleRule>;
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
	style: RecipeStyleRule;
};

type RecipeDefinition<Variants extends VariantGroups> = {
	base?: RecipeStyleRule;
	compoundVariants?: CompoundVariant<Variants>[];
	defaultVariants?: VariantSelection<Variants>;
	variants?: Variants;
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
 * Builds a cva-style recipe with vanilla-extract: each variant value compiles to its own class in the
 * `components` cascade layer, and the returned function resolves a variant selection to the matching class
 * string. The serializer reconstructs that function in the client bundle, so no build-time style code ships.
 *
 * @param definition base style, variant groups, optional compound variants and defaults
 * @param debugId optional name woven into generated class identifiers
 * @returns a function mapping a variant selection to its resolved class string
 */
export const recipe = <Variants extends VariantGroups>(
	definition: RecipeDefinition<Variants>,
	debugId?: string,
): RecipeRuntimeFn<Variants> => {
	const { base, compoundVariants = [], defaultVariants = {}, variants = {} as Variants } = definition;

	const layered = (rule: RecipeStyleRule): ComplexStyleRule => {
		// a bare class name composes via array form; style objects go into the components layer
		return typeof rule === 'string' ? [rule] : { '@layer': { [components]: rule } };
	};

	let defaultClassName: string;
	if (base == null) {
		defaultClassName = style({}, debugId);
	} else if (typeof base === 'string') {
		defaultClassName = `${style({}, debugId)} ${base}`;
	} else {
		defaultClassName = style(layered(base), debugId);
	}

	const variantClassNames = mapValues(variants, (group, groupName) => {
		return styleVariants(group, (rule) => layered(rule), debugId ? `${debugId}_${groupName}` : groupName);
	});

	const compounds = compoundVariants.map(
		({ style: rule, ...check }, index): [Record<string, VariantValue | VariantValue[]>, string] => {
			return [
				check as Record<string, VariantValue | VariantValue[]>,
				style(layered(rule), debugId ? `${debugId}_compound_${index}` : undefined),
			];
		},
	);

	const config: RecipeConfig = {
		compoundVariants: compounds,
		defaultClassName,
		defaultVariants: defaultVariants as RecipeConfig['defaultVariants'],
		variantClassNames,
	};

	return addFunctionSerializer<RecipeFn>(createRuntimeFn(config), {
		args: [config],
		importName: 'createRuntimeFn',
		importPath: '#/components/web/css/recipe-runtime',
	}) as RecipeRuntimeFn<Variants>;
};
