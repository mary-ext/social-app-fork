import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';

import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { ResourceUri } from '@atcute/lexicons';

import { PROD_FEEDS, STAGING_FEEDS } from '#/lib/constants';
import { useThrottledCallback } from '#/lib/hooks/use-debounce';
import { onVisibilityChange } from '#/lib/visibility';

import { type FeedSourceFeedInfo, type FeedSourceInfo, isFeedSourceFeedInfo } from '#/state/queries/feed';
import type { FeedDescriptor, FeedPostSliceItem } from '#/state/queries/post-feed';

import * as PostFeed from '#/components/PostFeed/PostFeed';

import { getClients } from './session';

export const FEEDBACK_FEEDS = [...PROD_FEEDS, ...STAGING_FEEDS];

export const THIRD_PARTY_ALLOWED_INTERACTIONS = new Set<AppBskyFeedDefs.Interaction['event']>([
	// explicit actions are safe to send.
	'app.bsky.feed.defs#requestLess',
	'app.bsky.feed.defs#requestMore',
	// these events are already available from the firehose.
	'app.bsky.feed.defs#interactionLike',
	'app.bsky.feed.defs#interactionQuote',
	'app.bsky.feed.defs#interactionReply',
	'app.bsky.feed.defs#interactionRepost',
	// pagination implies this event except on the final page.
	'app.bsky.feed.defs#interactionSeen',
]);

export type StateContext = {
	enabled: boolean;
	onItemSeen: (item: PostFeed.FeedRow) => void;
	sendInteraction: (interaction: AppBskyFeedDefs.Interaction) => void;
	feedSourceInfo: FeedSourceInfo | undefined;
};

const stateContext = createContext<StateContext>({
	enabled: false,
	onItemSeen: (_item: PostFeed.FeedRow) => {},
	sendInteraction: (_interaction: AppBskyFeedDefs.Interaction) => {},
	feedSourceInfo: undefined,
});
stateContext.displayName = 'FeedFeedbackContext';

export function useFeedFeedback(feedSourceInfo: FeedSourceInfo | undefined, hasSession: boolean) {
	const { appview } = getClients();

	const feed = !!feedSourceInfo && isFeedSourceFeedInfo(feedSourceInfo) ? feedSourceInfo : undefined;

	const isDiscover = isDiscoverFeed(feed?.feedDescriptor);
	const acceptsInteractions = !!(isDiscover || feed?.acceptsInteractions);
	const proxyDid = feed?.view?.did;
	const enabled = !!feed && !!proxyDid && acceptsInteractions && hasSession;

	const queue = useRef<Set<string>>(new Set());
	const history = useRef<
		// a WeakSet avoids manual cleanup when feed items are replaced.
		WeakSet<FeedPostSliceItem | AppBskyFeedDefs.Interaction>
	>(new WeakSet());

	const sendToFeedNoDelay = useCallback(() => {
		const interactions = Array.from(queue.current).map(toInteraction);
		queue.current.clear();

		const interactionsToSend = interactions.filter(
			(interaction) => interaction.event && isInteractionAllowed(enabled, feed, interaction.event),
		);

		if (interactionsToSend.length === 0) {
			return;
		}

		ok(
			appview.post('app.bsky.feed.sendInteractions', {
				headers: { 'atproto-proxy': `${proxyDid}#bsky_fg` },
				// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `uri` widens to `string` only for the Following pseudo-feed
				input: { interactions: interactionsToSend, feed: feed?.uri as ResourceUri | undefined },
			}),
		).catch(() => {}); // ignore upstream errors
	}, [appview, proxyDid, enabled, feed]);

	// queued interactions are still worth reporting after teardown
	const sendToFeed = useThrottledCallback(sendToFeedNoDelay, 10e3, {
		leading: false,
		onUnmount: 'flush',
	});

	useEffect(() => {
		if (!enabled) {
			return;
		}
		return onVisibilityChange((visible) => {
			if (!visible) {
				sendToFeed.flush();
			}
		});
	}, [enabled, sendToFeed]);

	const onItemSeen = useCallback(
		(feedItem: PostFeed.FeedRow) => {
			if (!enabled) {
				return;
			}
			const items = PostFeed.getItemsForFeedback(feedItem);
			for (const { item: postItem, feedContext, reqId } of items) {
				if (!history.current.has(postItem)) {
					history.current.add(postItem);
					queue.current.add(
						toString({
							item: postItem.post.uri,
							event: 'app.bsky.feed.defs#interactionSeen',
							feedContext,
							reqId,
						}),
					);
					sendToFeed();
				}
			}
		},
		[enabled, sendToFeed],
	);

	const sendInteraction = useCallback(
		(interaction: AppBskyFeedDefs.Interaction) => {
			if (!enabled) {
				return;
			}
			if (!history.current.has(interaction)) {
				history.current.add(interaction);
				queue.current.add(toString(interaction));
				sendToFeed();
			}
		},
		[enabled, sendToFeed],
	);

	return useMemo(() => {
		return {
			enabled,
			onItemSeen,
			sendInteraction,
			feedSourceInfo: typeof feed === 'object' ? feed : undefined,
		};
	}, [enabled, onItemSeen, sendInteraction, feed]);
}

export const FeedFeedbackProvider = stateContext.Provider;

export function useFeedFeedbackContext() {
	return useContext(stateContext);
}

// restrict feedback to Discover until third-party permissions exist.
export function isDiscoverFeed(feed?: FeedDescriptor) {
	return !!feed && FEEDBACK_FEEDS.includes(feed);
}

function isInteractionAllowed(
	enabled: boolean,
	feed: FeedSourceFeedInfo | undefined,
	interaction: AppBskyFeedDefs.Interaction['event'],
) {
	if (!enabled || !feed) {
		return false;
	}
	const isDiscover = isDiscoverFeed(feed.feedDescriptor);
	return isDiscover ? true : THIRD_PARTY_ALLOWED_INTERACTIONS.has(interaction);
}

function toString(interaction: AppBskyFeedDefs.Interaction): string {
	return `${interaction.item}|${interaction.event}|${
		interaction.feedContext || ''
	}|${interaction.reqId || ''}`;
}

function toInteraction(str: string): AppBskyFeedDefs.Interaction {
	const [item, event, feedContext, reqId] = str.split('|');
	// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- every queued string comes from `toString`, so the fields round-trip
	return { item, event, feedContext, reqId } as AppBskyFeedDefs.Interaction;
}
