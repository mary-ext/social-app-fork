import type { CSSProperties, ReactNode, SVGProps } from 'react';

import { tokens, useTheme } from '#/alf';

export type Props = {
	fill?: string;
	gradient?: keyof typeof tokens.gradients;
	size?: keyof typeof sizes;
	style?: CSSProperties;
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

export function useCommonSVGProps(props: Props) {
	const t = useTheme();
	const { fill, gradient, size, style, width, ...rest } = props;
	const _size = Number(size ? sizes[size] : width || sizes.md);
	let _fill = fill || style?.color || t.palette.primary_500;
	let gradientDef: ReactNode = null;

	if (gradient && tokens.gradients[gradient]) {
		const id = gradient + '_' + crypto.randomUUID();
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
		style,
		...rest,
	};
}
