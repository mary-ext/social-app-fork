import { type DimensionValue, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { s } from '#/lib/styles';

import { useTheme } from '#/alf';

export function LoadingPlaceholder({
	width,
	height,
	style,
}: {
	width: DimensionValue;
	height: DimensionValue | undefined;
	style?: StyleProp<ViewStyle>;
}) {
	const t = useTheme();
	return (
		<View
			style={[
				styles.loadingPlaceholder,
				{
					width,
					height,
					backgroundColor: t.palette.contrast_50,
				},
				style,
			]}
		/>
	);
}

export function ProfileCardLoadingPlaceholder({ style }: { style?: StyleProp<ViewStyle> }) {
	return (
		<View style={[styles.profileCard, style]}>
			<LoadingPlaceholder width={40} height={40} style={styles.profileCardAvi} />
			<View>
				<LoadingPlaceholder width={140} height={8} style={[s.mb5]} />
				<LoadingPlaceholder width={120} height={8} style={[s.mb10]} />
				<LoadingPlaceholder width={220} height={8} style={[s.mb5]} />
			</View>
		</View>
	);
}

export function ProfileCardFeedLoadingPlaceholder() {
	return (
		<>
			<ProfileCardLoadingPlaceholder />
			<ProfileCardLoadingPlaceholder />
			<ProfileCardLoadingPlaceholder />
			<ProfileCardLoadingPlaceholder />
			<ProfileCardLoadingPlaceholder />
			<ProfileCardLoadingPlaceholder />
			<ProfileCardLoadingPlaceholder />
			<ProfileCardLoadingPlaceholder />
			<ProfileCardLoadingPlaceholder />
			<ProfileCardLoadingPlaceholder />
			<ProfileCardLoadingPlaceholder />
		</>
	);
}

const styles = StyleSheet.create({
	loadingPlaceholder: {
		borderRadius: 6,
	},
	avatar: {
		borderRadius: 999,
		marginRight: 12,
	},
	profileCard: {
		flexDirection: 'row',
		padding: 10,
		margin: 1,
	},
	profileCardAvi: {
		borderRadius: 999,
		marginRight: 10,
	},
});
