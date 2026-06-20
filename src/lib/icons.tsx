import type { CSSProperties } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { flatten } from '#/alf';

// Copyright (c) 2020 Refactoring UI Inc.
// https://github.com/tailwindlabs/heroicons/blob/master/LICENSE
export function MagnifyingGlassIcon({
	color = 'currentColor',
	size,
	strokeWidth = 2,
	style,
}: {
	color?: string;
	size?: number | string;
	strokeWidth?: number;
	style?: StyleProp<ViewStyle>;
}) {
	return (
		<svg
			fill="none"
			viewBox="0 0 24 24"
			strokeWidth={strokeWidth}
			stroke={color}
			width={size || 24}
			height={size || 24}
			style={flatten(style) as CSSProperties}
		>
			<path
				strokeLinecap="round"
				strokeLinejoin="round"
				d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
			/>
		</svg>
	);
}
