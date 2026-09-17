import { type CSSProperties, generateIdentifier, globalStyle } from '@vanilla-extract/css';

/** CSS properties supported by `::highlight()`. */
export type HighlightStyleRule = Pick<
	CSSProperties,
	| 'backgroundColor'
	| 'color'
	| 'textDecoration'
	| 'textDecorationColor'
	| 'textDecorationLine'
	| 'textDecorationStyle'
	| 'textDecorationThickness'
	| 'textShadow'
>;

/**
 * registers a uniquely named `::highlight()` rule. call from a `.css.ts` file.
 *
 * @param rule styles applied to the highlighted text
 * @param debugId label included in the generated name
 * @returns the name to use in `CSS.highlights`
 */
export const highlightStyle = (rule: HighlightStyleRule, debugId: string): string => {
	const name = generateIdentifier(debugId);
	globalStyle(`::highlight(${name})`, rule);

	return name;
};
