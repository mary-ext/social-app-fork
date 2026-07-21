import { useMemo } from 'react';
import { type DimensionValue, View } from 'react-native';

import { atoms as a, useTheme } from '#/alf';

export function ConstrainedImage({
	aspectRatio,
	children,
}: {
	aspectRatio: number;
	children: React.ReactNode;
}) {
	const t = useTheme();
	/** Computed as a % value to apply as `paddingTop`, this basically controls the height of the image. */
	const outerAspectRatio = useMemo<DimensionValue>(() => {
		const ratio = Math.min(1 / aspectRatio, 1); // 1:1 bounding box
		return `${ratio * 100}%`;
	}, [aspectRatio]);

	return (
		<View style={[a.w_full]}>
			<View style={[a.overflow_hidden, { paddingTop: outerAspectRatio }]}>
				<View style={[a.absolute, a.inset_0, a.flex_row]}>
					<View style={[a.h_full, a.rounded_md, a.overflow_hidden, t.atoms.bg_contrast_25, { aspectRatio }]}>
						{children}
					</View>
				</View>
			</View>
		</View>
	);
}
