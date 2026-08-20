import { createContext, useContext, useEffect, useRef } from 'react';

import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { Did, ResourceUri } from '@atcute/lexicons';

import { onVisibilityChange } from '#/lib/browser/visibility';
import { FIRST_PARTY_FEED_URIS } from '#/lib/constants/feeds';
import { useThrottledCallback } from '#/lib/hooks/use-debounce';

import { type FeedSourceInfo, isFeedSourceFeedInfo } from '#/state/queries/feed';
import type { FeedPostSliceItem } from '#/state/queries/post-feed';

import * as PostFeed from '#/components/PostFeed/PostFeed';

import { getClients } from './session';

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

/** identifies a feed generator that accepts interaction reports. */
export type FeedFeedbackTarget = {
	uri: ResourceUri;
	serviceDid: Did;
};

/**
 * gets the interaction reporting target for a feed.
 *
 * @param info the feed
 * @returns the target when interactions are accepted
 */
export const toFeedFeedbackTarget = (info: FeedSourceInfo): FeedFeedbackTarget | undefined => {
	if (!isFeedSourceFeedInfo(info) || info.feedDescriptor.type !== 'feedgen') {
		return undefined;
	}

	const uri = info.feedDescriptor.uri;
	const serviceDid = info.view?.did;
	if (!serviceDid || !(isFirstPartyFeed(uri) || info.acceptsInteractions)) {
		return undefined;
	}

	return { uri, serviceDid };
};

export type StateContext = {
	enabled: boolean;
	onItemSeen: (item: PostFeed.FeedRow) => void;
	sendInteraction: (interaction: AppBskyFeedDefs.Interaction) => void;
	feed: FeedFeedbackTarget | undefined;
};

const stateContext = createContext<StateContext>({
	enabled: false,
	onItemSeen: (_item: PostFeed.FeedRow) => {},
	sendInteraction: (_interaction: AppBskyFeedDefs.Interaction) => {},
	feed: undefined,
});
stateContext.displayName = 'FeedFeedbackContext';

export function useFeedFeedback(feed: FeedFeedbackTarget | undefined, hasSession: boolean) {
	const { appview } = getClients();

	const enabled = !!feed && hasSession;

	const queue = useRef<Set<string>>(new Set());
	const history = useRef<
		// a WeakSet avoids manual cleanup when feed items are replaced.
		WeakSet<FeedPostSliceItem | AppBskyFeedDefs.Interaction>
	>(new WeakSet());

	const sendToFeedNoDelay = () => {
		if (!feed || !hasSession) {
			return;
		}

		const interactions = Array.from(queue.current).map(toInteraction);
		queue.current.clear();

		const interactionsToSend = interactions.filter(
			(interaction) => interaction.event && isInteractionAllowed(feed, interaction.event),
		);

		if (interactionsToSend.length === 0) {
			return;
		}

		ok(
			appview.post('app.bsky.feed.sendInteractions', {
				headers: { 'atproto-proxy': `${feed.serviceDid}#bsky_fg` },
				input: { interactions: interactionsToSend, feed: feed.uri },
			}),
		).catch(() => {}); // ignore upstream errors
	};

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

	const onItemSeen = (feedItem: PostFeed.FeedRow) => {
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
	};

	const sendInteraction = (interaction: AppBskyFeedDefs.Interaction) => {
		if (!enabled) {
			return;
		}
		if (!history.current.has(interaction)) {
			history.current.add(interaction);
			queue.current.add(toString(interaction));
			sendToFeed();
		}
	};

	return {
		enabled,
		onItemSeen,
		sendInteraction,
		feed,
	};
}

export const FeedFeedbackProvider = stateContext.Provider;

export function useFeedFeedbackContext() {
	return useContext(stateContext);
}

function isFirstPartyFeed(uri: ResourceUri) {
	return FIRST_PARTY_FEED_URIS.includes(uri);
}

function isInteractionAllowed(feed: FeedFeedbackTarget, interaction: AppBskyFeedDefs.Interaction['event']) {
	return isFirstPartyFeed(feed.uri) ? true : THIRD_PARTY_ALLOWED_INTERACTIONS.has(interaction);
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
