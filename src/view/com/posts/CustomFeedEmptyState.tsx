import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { DISCOVER_FEED_URI } from '#/lib/constants';
import { usePalette } from '#/lib/hooks/usePalette';
import { MagnifyingGlassIcon } from '#/lib/icons';
import { s } from '#/lib/styles';

import { useFeedFeedbackContext } from '#/state/feed-feedback';
import { useSession } from '#/state/session';

import { ChevronRight_Stroke2_Corner0_Rounded as ChevronRightIcon } from '#/components/icons/Chevron';

import { m } from '#/paraglide/messages';
import { useNavigate } from '#/routes';
import { colors } from '#/styles/colors';

import { Button } from '../util/forms/Button';
import { Text } from '../util/text/Text';
import * as css from './CustomFeedEmptyState.css';

export function CustomFeedEmptyState() {
	const feedFeedback = useFeedFeedbackContext();
	const { currentAccount } = useSession();
	const hasLoggedDiscoverEmptyErrorRef = useRef(false);

	useEffect(() => {
		// Log the empty feed error event
		if (feedFeedback.feedSourceInfo && currentAccount?.did) {
			const uri = feedFeedback.feedSourceInfo.uri;
			if (uri === DISCOVER_FEED_URI && !hasLoggedDiscoverEmptyErrorRef.current) {
				hasLoggedDiscoverEmptyErrorRef.current = true;
			}
		}
	}, [feedFeedback.feedSourceInfo, currentAccount?.did]);
	const pal = usePalette('default');
	const palInverted = usePalette('inverted');
	const navigate = useNavigate();

	const onPressFindAccounts = () => {
		navigate('Search', {});
	};

	return (
		<View style={styles.emptyContainer}>
			<View style={styles.emptyIconContainer}>
				<MagnifyingGlassIcon color={colors.text} className={css.icon} size={62} />
			</View>
			<Text type="xl-medium" style={[s.textCenter, pal.text]}>
				{m['view.posts.feed.empty']()}
			</Text>
			<Button type="inverted" style={styles.emptyBtn} onPress={onPressFindAccounts}>
				<Text type="lg-medium" style={palInverted.text}>
					{m['view.posts.follow.findAccounts']()}
				</Text>
				<ChevronRightIcon width={14} fill={colors.textInverted} />
			</Button>
		</View>
	);
}
const styles = StyleSheet.create({
	emptyContainer: {
		height: '100%',
		paddingVertical: 40,
		paddingHorizontal: 30,
	},
	emptyIconContainer: {
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

	feedsTip: {
		position: 'absolute',
		left: 22,
	},
	feedsTipArrow: {
		marginLeft: 32,
		marginTop: 8,
	},
});
