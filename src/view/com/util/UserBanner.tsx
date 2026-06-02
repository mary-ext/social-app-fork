import { StyleSheet, View } from 'react-native';
import type { DisplayRestrictions } from '@atcute/bluesky-moderation';

import { tokens, useTheme } from '#/alf';

import { Image } from '#/shims/image';

export function UserBanner({
	type,
	banner,
	moderation,
}: {
	type?: 'labeler' | 'default';
	banner?: string | null;
	moderation?: DisplayRestrictions;
}) {
	const t = useTheme();

	return banner ? (
		<Image
			style={[styles.bannerImage, t.atoms.bg_contrast_25]}
			contentFit="cover"
			source={{ uri: banner }}
			blurRadius={(moderation?.blurs.length ?? 0) > 0 ? 100 : 0}
			accessible={true}
			accessibilityIgnoresInvertColors
		/>
	) : (
		<View style={[styles.bannerImage, type === 'labeler' ? styles.labelerBanner : t.atoms.bg_contrast_25]} />
	);
}

const styles = StyleSheet.create({
	bannerImage: {
		width: '100%',
		height: 150,
	},
	labelerBanner: {
		backgroundColor: tokens.color.temp_purple,
	},
});
