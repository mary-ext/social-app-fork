import { Dimensions, StyleSheet, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { usePalette } from '#/lib/hooks/usePalette';
import type { NavigationProp } from '#/lib/routes/types';
import { s } from '#/lib/styles';

import { ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon } from '#/components/icons/Chevron';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import { Button } from '../util/forms/Button';
import { Text } from '../util/text/Text';

export function FollowingEndOfFeed() {
	const pal = usePalette('default');
	const palInverted = usePalette('inverted');
	const navigation = useNavigation<NavigationProp>();

	const onPressFindAccounts = () => {
		navigation.navigate('Search', {});
	};

	const onPressDiscoverFeeds = () => {
		navigation.navigate('Feeds');
	};

	return (
		<View style={[styles.container, pal.border, { minHeight: Dimensions.get('window').height * 0.75 }]}>
			<View style={styles.inner}>
				<Text type="xl-medium" style={[s.textCenter, pal.text]}>
					{m['view.posts.feed.endOfFeed']()}
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
		flexDirection: 'row',
		justifyContent: 'center',
		paddingTop: 40,
		paddingBottom: 80,
		paddingHorizontal: 30,
		borderTopWidth: 1,
	},
	inner: {
		width: '100%',
		maxWidth: 460,
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
