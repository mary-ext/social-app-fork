import { useMemo } from 'react';
import { StyleSheet, Text as RNText, type TextProps } from 'react-native';

import { lh, s } from '#/lib/styles';
import { type TypographyVariant, useTheme } from '#/lib/ThemeContext';
import { logger } from '#/logger';
import { applyFonts, useAlf } from '#/alf';
import { childHasEmoji, type StringChild } from '#/alf/typography';

export type CustomTextProps = Omit<TextProps, 'children'> & {
	type?: TypographyVariant;
	lineHeight?: number;
	title?: string;
	dataSet?: Record<string, string | number>;
	selectable?: boolean;
} & (
		| {
				emoji: true;
				children: StringChild;
		  }
		| {
				emoji?: false;
				children: TextProps['children'];
		  }
	);

export { Text_DEPRECATED as Text };
/** @deprecated use Text from `#/components/Typography.tsx` instead */
function Text_DEPRECATED({
	type = 'md',
	children,
	emoji,
	lineHeight,
	style,
	title,
	dataSet,
	selectable,
	...props
}: React.PropsWithChildren<CustomTextProps>) {
	const theme = useTheme();
	const { fonts } = useAlf();

	if (import.meta.env.DEV) {
		if (!emoji && childHasEmoji(children)) {
			logger.warn(
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-base-to-string
				`Text: emoji detected but emoji not enabled: "${children}"\n\nPlease add <Text emoji />'`,
			);
		}
	}

	const textProps = useMemo(() => {
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

		return {
			selectable,
			style: flattened,
			dataSet: Object.assign({ tooltip: title }, dataSet || {}),
			...props,
		};
	}, [
		dataSet,
		fonts.family,
		fonts.scaleMultiplier,
		lineHeight,
		props,
		selectable,
		style,
		theme,
		title,
		type,
	]);

	return <RNText {...textProps}>{children}</RNText>;
}
