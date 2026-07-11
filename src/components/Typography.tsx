import { Text as RNText, type TextStyle } from 'react-native';

import { logger } from '#/logger';

import { atoms as a, useAlf, useTheme } from '#/alf';
import { childHasEmoji, normalizeTextStyles, stringChildren, type TextProps } from '#/alf/typography';

export type { TextProps };
export { Text as Span } from 'react-native';

/** Our main text component. Use this most of the time. */
export function Text({
	children,
	emoji,
	style,
	selectable,
	dataSet,
	numberOfLines,
	allowFontScaling = true,
	...rest
}: TextProps) {
	const { fonts, flags } = useAlf();
	const t = useTheme();
	const s = normalizeTextStyles(
		[a.text_sm, t.atoms.text, a.leading_snug, numberOfLines === 1 && numberOfLinesClippingFix, style],
		{
			fontScale: allowFontScaling ? fonts.scaleMultiplier : 1,
			fontFamily: fonts.family,
			flags,
		},
	);

	if (import.meta.env.DEV) {
		if (!emoji && childHasEmoji(children)) {
			logger.warn(
				`Text: emoji detected but emoji not enabled: "${stringChildren(children)}"\n\nPlease add <Text emoji />'`,
			);
		}
	}

	const shared = {
		selectable,
		numberOfLines,
		style: s,
		dataSet,
		allowFontScaling,
		...rest,
	};

	return <RNText {...shared}>{children}</RNText>;
}

function createHeadingElement({ level }: { level: number }) {
	return function HeadingElement({ style, ...rest }: TextProps) {
		const attr = {
			role: 'heading',
			'aria-level': level,
		} as unknown as Pick<TextProps, 'role'> & { 'aria-level': number };
		return <Text {...attr} {...rest} style={style} />;
	};
}

/*
 * Use semantic components when it's beneficial to the user or to a web scraper
 */
export const H1 = createHeadingElement({ level: 1 });
export const H3 = createHeadingElement({ level: 3 });
export function P({ style, ...rest }: TextProps) {
	const attr = {
		role: 'paragraph',
	} as unknown as Pick<TextProps, 'role'>;
	return <Text {...attr} {...rest} style={[a.text_md, a.leading_relaxed, style]} />;
}

/**
 * overrides the default `overflow: hidden` style applied by React Native Web when using `numberOfLines={1}`
 * to prevent clipping of ascenders/descenders by applying `overflowX: 'hidden'` instead.
 *
 * @see https://github.com/necolas/react-native-web/pull/2836
 */
const numberOfLinesClippingFix = {
	overflowY: 'visible',
	overflowX: 'clip',
	// mimic browser default behavior of `min-width: 0` on `overflow: hidden`
	// elements to allow text to shrink smaller than its intrinsic width when
	// necessary
	minWidth: 0,
	// this is neater and supports vertical writing modes, but it's only baseline newly available
	// overflowInline: 'clip',
} as unknown as TextStyle;
