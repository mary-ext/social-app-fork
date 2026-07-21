import { StyleSheet, Text as RNText, type TextProps } from 'react-native';

import { lh, s } from '#/lib/styles';
import { type TypographyVariant, useTheme } from '#/lib/ThemeContext';

import { applyFonts, useAlf } from '#/alf';

export type CustomTextProps = TextProps & {
	type?: TypographyVariant;
	lineHeight?: number;
	dataSet?: Record<string, string | number>;
	selectable?: boolean;
};

export { Text_DEPRECATED as Text };
/** @deprecated use Text from `#/components/Typography.tsx` instead */
function Text_DEPRECATED({
	type = 'md',
	children,
	lineHeight,
	style,
	dataSet,
	selectable,
	...props
}: React.PropsWithChildren<CustomTextProps>) {
	const theme = useTheme();
	const { fonts } = useAlf();

	const typography = theme.typography[type];
	const lineHeightStyle = lineHeight ? lh(theme, type, lineHeight) : undefined;

	const flattened = StyleSheet.flatten([s.black, typography, lineHeightStyle, style]);

	applyFonts(flattened, fonts.family);

	// should always be defined on `typography`
	// @ts-ignore
	if (flattened.fontSize) {
		// @ts-ignore
		flattened.fontSize = Math.round(
			// @ts-ignore
			flattened.fontSize * fonts.scaleMultiplier,
		);
	}

	const textProps = {
		selectable,
		style: flattened,
		dataSet,
		...props,
	};

	return <RNText {...textProps}>{children}</RNText>;
}
