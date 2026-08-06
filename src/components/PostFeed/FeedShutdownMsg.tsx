import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { DISCOVER_FEED_URI, bskyFeedUri } from '#/lib/constants/feeds';
import { feedTarget } from '#/lib/routes/targets';

import { setSelectedFeed } from '#/state/preferences/selected-feed';
import {
	usePreferencesQuery,
	useRemoveFeedMutation,
	useReplaceForYouWithDiscoverFeedMutation,
} from '#/state/queries/preferences';

import { Trans } from '#/locale/Trans';

import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonText } from '#/components/web/Button';
import { InlineLinkText } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

import * as css from './FeedShutdownMsg.css';

const DISCOVER_URIP = parseCanonicalResourceUri(DISCOVER_FEED_URI);
const DISCOVER_TARGET = feedTarget(DISCOVER_URIP.repo, DISCOVER_URIP.rkey);

export function FeedShutdownMsg({ feedUri, topBorder = false }: { feedUri: string; topBorder?: boolean }) {
	const { data: preferences } = usePreferencesQuery();
	const { mutateAsync: removeFeed, isPending: isRemovePending } = useRemoveFeedMutation();
	const { mutateAsync: replaceFeedWithDiscover, isPending: isReplacePending } =
		useReplaceForYouWithDiscoverFeedMutation();

	const feedConfig = preferences?.savedFeeds?.find((f) => f.value === feedUri && f.pinned);
	const discoverFeedConfig = preferences?.savedFeeds?.find((f) => f.value === bskyFeedUri('whats-hot'));
	const hasFeedPinned = !!feedConfig;
	const hasDiscoverPinned = !!discoverFeedConfig?.pinned;

	const onRemoveFeed = async () => {
		try {
			if (feedConfig) {
				await removeFeed(feedConfig);
				Toast.show(m['common.feeds.removedToast']());
			}
			if (hasDiscoverPinned) {
				setSelectedFeed(`feedgen|${bskyFeedUri('whats-hot')}`);
			}
		} catch (err) {
			console.error('Failed to update feeds', err);
			Toast.show(m['common.feeds.updateError'](), {
				type: 'warning',
			});
		}
	};

	const onReplaceFeed = async () => {
		try {
			await replaceFeedWithDiscover({
				forYouFeedConfig: feedConfig,
				discoverFeedConfig,
			});
			setSelectedFeed(`feedgen|${bskyFeedUri('whats-hot')}`);
			Toast.show(m['view.posts.feed.replace.toast']());
		} catch (err) {
			console.error('Failed to update feeds', err);
			Toast.show(m['common.feeds.updateError'](), {
				type: 'warning',
			});
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
							<InlineLinkText label={m['view.posts.discover.feedName']()} size="md" to={DISCOVER_TARGET}>
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
