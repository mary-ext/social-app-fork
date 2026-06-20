import type { CSSProperties, SVGProps } from 'react';
import type { TextProps } from 'react-native';

import { flatten, useTheme } from '#/alf';

import { Image } from '#/shims/image';
import { useKawaiiMode } from '#/storage/hooks/kawaii';

const ratio = 57 / 64;

type Props = {
	fill?: string;
	style?: TextProps['style'];
} & Omit<SVGProps<SVGSVGElement>, 'fill' | 'style'>;

export function Logo(props: Props) {
	const t = useTheme();
	const { fill, style, ...rest } = props;
	const gradient = fill === 'sky';
	const styles = flatten(style);
	const _fill = gradient
		? 'url(#sky)'
		: fill || (styles?.color as string | undefined) || t.palette.primary_500;
	const size = parseInt(String(rest.width || 32), 10);

	const isKawaii = useKawaiiMode();

	if (isKawaii) {
		return (
			<Image
				source={
					size > 100 ? require('../../../assets/kawaii.png') : require('../../../assets/kawaii_smol.png')
				}
				accessibilityLabel="Bluesky"
				accessibilityHint=""
				accessibilityIgnoresInvertColors
				style={[{ height: size, aspectRatio: 1.4 }]}
			/>
		);
	}

	return (
		<svg
			fill="none"
			viewBox="0 0 64 57"
			{...rest}
			style={flatten([{ width: size, height: size * ratio }, styles]) as CSSProperties}
		>
			{gradient && (
				<defs>
					<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0" stopColor="#0A7AFF" stopOpacity="1" />
						<stop offset="1" stopColor="#59B9FF" stopOpacity="1" />
					</linearGradient>
				</defs>
			)}

			<path
				fill={_fill}
				d="M13.873 3.805C21.21 9.332 29.103 20.537 32 26.55v15.882c0-.338-.13.044-.41.867-1.512 4.456-7.418 21.847-20.923 7.944-7.111-7.32-3.819-14.64 9.125-16.85-7.405 1.264-15.73-.825-18.014-9.015C1.12 23.022 0 8.51 0 6.55 0-3.268 8.579-.182 13.873 3.805ZM50.127 3.805C42.79 9.332 34.897 20.537 32 26.55v15.882c0-.338.13.044.41.867 1.512 4.456 7.418 21.847 20.923 7.944 7.111-7.32 3.819-14.64-9.125-16.85 7.405 1.264 15.73-.825 18.014-9.015C62.88 23.022 64 8.51 64 6.55c0-9.818-8.578-6.732-13.873-2.745Z"
			/>
		</svg>
	);
}
