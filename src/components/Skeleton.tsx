import type { ReactNode } from 'react';
import { View } from 'react-native';

import { atoms as a, useTheme, type ViewStyleProp } from '#/alf';

type SkeletonProps = {
	blend?: boolean;
};

export function Circle({
	children,
	size,
	blend,
	style,
}: ViewStyleProp & { children?: ReactNode; size: number } & SkeletonProps) {
	const t = useTheme();
	return (
		<View
			style={[
				a.justify_center,
				a.align_center,
				a.rounded_full,
				t.atoms.bg_contrast_50,
				{
					width: size,
					height: size,
					opacity: blend ? 0.6 : 1,
				},
				style,
			]}
		>
			{children}
		</View>
	);
}

export function Pill({ size, blend, style }: ViewStyleProp & { size: number } & SkeletonProps) {
	const t = useTheme();
	return (
		<View
			style={[
				a.rounded_full,
				t.atoms.bg_contrast_50,
				{
					width: size * 1.618,
					height: size,
					opacity: blend ? 0.6 : 1,
				},
				style,
			]}
		/>
	);
}
