import { DISCOVER_FEED_URI, PROD_DEFAULT_FEED } from '#/lib/constants';
import { feedUriToHref } from '#/lib/strings/url-helpers';

import {
	usePreferencesQuery,
	useRemoveFeedMutation,
	useReplaceForYouWithDiscoverFeedMutation,
} from '#/state/queries/preferences';
import { useSetSelectedFeed } from '#/state/shell/selected-feed';

import { logger } from '#/logger';

import { Trans } from '#/locale/Trans';

import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonText } from '#/components/web/Button';
import { InlineLinkText } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

import * as css from './FeedShutdownMsg.css';

export function FeedShutdownMsg({ feedUri, topBorder = false }: { feedUri: string; topBorder?: boolean }) {
	const setSelectedFeed = useSetSelectedFeed();
	const { data: preferences } = usePreferencesQuery();
	const { mutateAsync: removeFeed, isPending: isRemovePending } = useRemoveFeedMutation();
	const { mutateAsync: replaceFeedWithDiscover, isPending: isReplacePending } =
		useReplaceForYouWithDiscoverFeedMutation();

	const feedConfig = preferences?.savedFeeds?.find((f) => f.value === feedUri && f.pinned);
	const discoverFeedConfig = preferences?.savedFeeds?.find((f) => f.value === PROD_DEFAULT_FEED('whats-hot'));
	const hasFeedPinned = !!feedConfig;
	const hasDiscoverPinned = !!discoverFeedConfig?.pinned;

	const onRemoveFeed = async () => {
		try {
			if (feedConfig) {
				await removeFeed(feedConfig);
				Toast.show(m['common.feeds.removedToast']());
			}
			if (hasDiscoverPinned) {
				setSelectedFeed(`feedgen|${PROD_DEFAULT_FEED('whats-hot')}`);
			}
		} catch (err) {
			Toast.show(m['common.feeds.updateError'](), {
				type: 'warning',
			});
			logger.error('Failed to update feeds', { message: err });
		}
	};

	const onReplaceFeed = async () => {
		try {
			await replaceFeedWithDiscover({
				forYouFeedConfig: feedConfig,
				discoverFeedConfig,
			});
			setSelectedFeed(`feedgen|${PROD_DEFAULT_FEED('whats-hot')}`);
			Toast.show(m['view.posts.feed.replace.toast']());
		} catch (err) {
			Toast.show(m['common.feeds.updateError'](), {
				type: 'warning',
			});
			logger.error('Failed to update feeds', { message: err });
		}
	};

	const isProcessing = isReplacePending || isRemovePending;
	return (
		<div className={css.root({ topBorder })}>
			<Text align="center" size="_5xl" weight="semiBold">
				:(
			</Text>
			<Text align="center" size="md">
				<Trans
					message={m['view.posts.feed.offlineFallback']}
					markup={{
						t0: ({ children }) => (
							<InlineLinkText
								label={m['view.posts.discover.feedName']()}
								size="md"
								to={feedUriToHref(DISCOVER_FEED_URI)}
							>
								{children}
							</InlineLinkText>
						),
					}}
				/>
			</Text>
			{hasFeedPinned ? (
				<div className={css.buttons}>
					<Button
						color="primary"
						disabled={isProcessing}
						label={m['view.posts.feed.remove.label']()}
						onClick={() => void onRemoveFeed()}
						variant="outline"
					>
						<ButtonText>{m['view.posts.feed.remove.label']()}</ButtonText>
						{isRemovePending && <Spinner color="default" label={m['common.status.saving']()} size="sm" />}
					</Button>
					{!hasDiscoverPinned && (
						<Button
							color="primary"
							disabled={isProcessing}
							label={m['view.posts.feed.replace.label']()}
							onClick={() => void onReplaceFeed()}
							variant="solid"
						>
							<ButtonText>{m['view.posts.feed.replace.label']()}</ButtonText>
							{isReplacePending && <Spinner color="white" label={m['common.status.saving']()} size="sm" />}
						</Button>
					)}
				</div>
			) : undefined}
		</div>
	);
}
