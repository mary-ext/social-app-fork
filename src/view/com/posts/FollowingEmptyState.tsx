import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { usePalette } from '#/lib/hooks/usePalette';
import { MagnifyingGlassIcon } from '#/lib/icons';
import type { NavigationProp } from '#/lib/routes/types';
import { s } from '#/lib/styles';

import { ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon } from '#/components/icons/Chevron';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import { Button } from '../util/forms/Button';
import { Text } from '../util/text/Text';
import * as css from './FollowingEmptyState.css';

export function FollowingEmptyState() {
	const pal = usePalette('default');
	const palInverted = usePalette('inverted');
	const navigation = useNavigation<NavigationProp>();

	const onPressFindAccounts = useCallback(() => {
		navigation.navigate('Search', {});
	}, [navigation]);

	const onPressDiscoverFeeds = useCallback(() => {
		navigation.navigate('Feeds');
	}, [navigation]);

	return (
		<View style={styles.container}>
			<View style={styles.inner}>
				<View style={styles.iconContainer}>
					<MagnifyingGlassIcon color={colors.text} className={css.icon} size={62} />
				</View>
				<Text type="xl-medium" style={[s.textCenter, pal.text]}>
					{m['view.posts.feed.followingEmpty']()}
				</Text>
				<Button type="inverted" style={styles.emptyBtn} onPress={onPressFindAccounts}>
					<Text type="lg-medium" style={palInverted.text}>
						{m['view.posts.follow.findAccounts']()}
					</Text>
					<ChevronRightIcon width={14} fill={colors.textInverted} />
				</Button>

				<Text type="xl-medium" style={[s.textCenter, pal.text, s.mt20]}>
					{m['view.posts.discover.hint']()}
				</Text>
				<Button type="inverted" style={[styles.emptyBtn, s.mt10]} onPress={onPressDiscoverFeeds}>
					<Text type="lg-medium" style={palInverted.text}>
						{m['view.posts.discover.findFeeds']()}
					</Text>
					<ChevronRightIcon width={14} fill={colors.textInverted} />
				</Button>
			</View>
		</View>
	);
}
const styles = StyleSheet.create({
	container: {
		height: '100%',
		flexDirection: 'row',
		justifyContent: 'center',
		paddingVertical: 40,
		paddingHorizontal: 30,
	},
	inner: {
		width: '100%',
		maxWidth: 460,
	},
	iconContainer: {
		marginBottom: 16,
	},
	emptyBtn: {
		marginVertical: 20,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 18,
		paddingHorizontal: 24,
		borderRadius: 30,
	},
});
