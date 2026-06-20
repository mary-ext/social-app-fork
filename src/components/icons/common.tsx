import type { CSSProperties, ReactNode, SVGProps } from 'react';
import { type ColorValue, StyleSheet, type TextProps, type TextStyle } from 'react-native';
import { nanoid } from 'nanoid/non-secure';

import { tokens, useTheme } from '#/alf';

export type Props = {
	fill?: ColorValue;
	gradient?: keyof typeof tokens.gradients;
	size?: keyof typeof sizes;
	style?: TextProps['style'];
} & Omit<SVGProps<SVGSVGElement>, 'fill' | 'style'>;

export const sizes = {
	'2xs': 8,
	xs: 12,
	sm: 16,
	md: 20,
	lg: 24,
	xl: 28,
	'2xl': 32,
	'3xl': 48,
	'4xl': 64,
} as const;

// StyleSheet.flatten leaves a few react-native-only shorthands that DOM inline
// styles don't understand; translate the ones icons actually receive and drop
// the pointer-events values (box-only/box-none) that have no CSS equivalent.
const rnStyleToDom = (style: TextStyle | undefined): CSSProperties | undefined => {
	if (!style) {
		return undefined;
	}
	const { marginHorizontal, marginVertical, paddingHorizontal, paddingVertical, pointerEvents, ...keep } =
		style as Record<string, unknown>;
	const domStyle: Record<string, unknown> = { ...keep };
	if (marginVertical != null) {
		domStyle.marginBlock = marginVertical;
	}
	if (marginHorizontal != null) {
		domStyle.marginInline = marginHorizontal;
	}
	if (paddingVertical != null) {
		domStyle.paddingBlock = paddingVertical;
	}
	if (paddingHorizontal != null) {
		domStyle.paddingInline = paddingHorizontal;
	}
	if (pointerEvents === 'auto' || pointerEvents === 'none') {
		domStyle.pointerEvents = pointerEvents;
	}
	return domStyle as CSSProperties;
};

export function useCommonSVGProps(props: Props) {
	const t = useTheme();
	const { fill, gradient, size, style, width, ...rest } = props;
	const flat = StyleSheet.flatten(style);
	const _size = Number(size ? sizes[size] : width || sizes.md);
	let _fill = (fill || flat?.color || t.palette.primary_500) as string;
	let gradientDef: ReactNode = null;

	if (gradient && tokens.gradients[gradient]) {
		const id = gradient + '_' + nanoid();
		const config = tokens.gradients[gradient];
		_fill = `url(#${id})`;
		gradientDef = (
			<defs>
				<linearGradient id={id} x1="0" y1="0" x2="100%" y2="0" gradientTransform="rotate(45)">
					{config.values.map(([stop, color]) => (
						<stop key={stop} offset={stop} stopColor={color} />
					))}
				</linearGradient>
			</defs>
		);
	}

	return {
		fill: _fill,
		gradient: gradientDef,
		size: _size,
		style: rnStyleToDom(flat),
		...rest,
	};
}
