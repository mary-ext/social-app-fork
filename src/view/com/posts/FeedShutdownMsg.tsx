import { useCallback } from 'react';
import { View } from 'react-native';
import { Trans } from '@lingui/react/macro';

import { DISCOVER_FEED_URI, PROD_DEFAULT_FEED } from '#/lib/constants';
import { feedUriToHref } from '#/lib/strings/url-helpers';

import {
	usePreferencesQuery,
	useRemoveFeedMutation,
	useReplaceForYouWithDiscoverFeedMutation,
} from '#/state/queries/preferences';
import { useSetSelectedFeed } from '#/state/shell/selected-feed';

import { logger } from '#/logger';

import { atoms as a, useTheme } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { InlineLinkText } from '#/components/Link';
import { Loader } from '#/components/Loader';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

export function FeedShutdownMsg({ feedUri }: { feedUri: string }) {
	const t = useTheme();
	const setSelectedFeed = useSetSelectedFeed();
	const { data: preferences } = usePreferencesQuery();
	const { mutateAsync: removeFeed, isPending: isRemovePending } = useRemoveFeedMutation();
	const { mutateAsync: replaceFeedWithDiscover, isPending: isReplacePending } =
		useReplaceForYouWithDiscoverFeedMutation();

	const feedConfig = preferences?.savedFeeds?.find((f) => f.value === feedUri && f.pinned);
	const discoverFeedConfig = preferences?.savedFeeds?.find((f) => f.value === PROD_DEFAULT_FEED('whats-hot'));
	const hasFeedPinned = Boolean(feedConfig);
	const hasDiscoverPinned = Boolean(discoverFeedConfig?.pinned);

	const onRemoveFeed = useCallback(async () => {
		try {
			if (feedConfig) {
				await removeFeed(feedConfig);
				Toast.show(m['common.label.removedFromFeeds']());
			}
			if (hasDiscoverPinned) {
				setSelectedFeed(`feedgen|${PROD_DEFAULT_FEED('whats-hot')}`);
			}
		} catch (err) {
			Toast.show(m['common.error.updateFeeds'](), {
				type: 'warning',
			});
			logger.error('Failed to update feeds', { message: err });
		}
	}, [removeFeed, feedConfig, hasDiscoverPinned, setSelectedFeed]);

	const onReplaceFeed = useCallback(async () => {
		try {
			await replaceFeedWithDiscover({
				forYouFeedConfig: feedConfig,
				discoverFeedConfig,
			});
			setSelectedFeed(`feedgen|${PROD_DEFAULT_FEED('whats-hot')}`);
			Toast.show(m['view.posts.feedback.replacedWithDiscover']());
		} catch (err) {
			Toast.show(m['common.error.updateFeeds'](), {
				type: 'warning',
			});
			logger.error('Failed to update feeds', { message: err });
		}
	}, [replaceFeedWithDiscover, discoverFeedConfig, feedConfig, setSelectedFeed]);

	const isProcessing = isReplacePending || isRemovePending;
	return (
		<View style={[a.py_3xl, a.px_2xl, a.gap_xl, t.atoms.border_contrast_low, a.border_t]}>
			<Text style={[a.text_5xl, a.font_semi_bold, t.atoms.text, a.text_center]}>:(</Text>
			<Text style={[a.text_md, a.leading_snug, t.atoms.text, a.text_center]}>
				<Trans>
					This feed is no longer online. We are showing{' '}
					<InlineLinkText
						label={m['view.posts.label.discoverFeed']()}
						to={feedUriToHref(DISCOVER_FEED_URI)}
						style={[a.text_md]}
					>
						Discover
					</InlineLinkText>{' '}
					instead.
				</Trans>
			</Text>
			{hasFeedPinned ? (
				<View style={[a.flex_row, a.justify_center, a.gap_sm]}>
					<Button
						variant="outline"
						color="primary"
						size="small"
						label={m['view.posts.action.removeFeed']()}
						disabled={isProcessing}
						onPress={() => void onRemoveFeed()}
					>
						<ButtonText>{m['view.posts.action.removeFeed']()}</ButtonText>
						{isRemovePending && <ButtonIcon icon={Loader} />}
					</Button>
					{!hasDiscoverPinned && (
						<Button
							variant="solid"
							color="primary"
							size="small"
							label={m['view.posts.action.replaceWithDiscover']()}
							disabled={isProcessing}
							onPress={() => void onReplaceFeed()}
						>
							<ButtonText>{m['view.posts.action.replaceWithDiscover']()}</ButtonText>
							{isReplacePending && <ButtonIcon icon={Loader} />}
						</Button>
					)}
				</View>
			) : undefined}
		</View>
	);
}
