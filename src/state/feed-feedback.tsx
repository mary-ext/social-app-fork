import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import type { AppBskyFeedDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { ResourceUri } from '@atcute/lexicons';

import throttle from 'lodash.throttle';

import { PROD_FEEDS, STAGING_FEEDS } from '#/lib/constants';
import { useConstant } from '#/lib/hooks/use-constant';

import { type FeedSourceFeedInfo, type FeedSourceInfo, isFeedSourceFeedInfo } from '#/state/queries/feed';
import type { FeedDescriptor, FeedPostSliceItem } from '#/state/queries/post-feed';

import { Logger } from '#/logger';

import * as PostFeed from '#/view/com/posts/PostFeed';

import { useClients } from './session';

export const FEEDBACK_FEEDS = [...PROD_FEEDS, ...STAGING_FEEDS];

export const THIRD_PARTY_ALLOWED_INTERACTIONS = new Set<AppBskyFeedDefs.Interaction['event']>([
	// These are explicit actions and are therefore fine to send.
	'app.bsky.feed.defs#requestLess',
	'app.bsky.feed.defs#requestMore',
	// These can be inferred from the firehose and are therefore fine to send.
	'app.bsky.feed.defs#interactionLike',
	'app.bsky.feed.defs#interactionQuote',
	'app.bsky.feed.defs#interactionReply',
	'app.bsky.feed.defs#interactionRepost',
	// This can be inferred from pagination requests for everything except the very last page
	// so it is fine to send. It is crucial for third party algorithmic feeds to receive these.
	'app.bsky.feed.defs#interactionSeen',
]);

export type StateContext = {
	enabled: boolean;
	onItemSeen: (item: PostFeed.FeedRow) => void;
	sendInteraction: (interaction: AppBskyFeedDefs.Interaction) => void;
	feedDescriptor: FeedDescriptor | undefined;
	feedSourceInfo: FeedSourceInfo | undefined;
};

const stateContext = createContext<StateContext>({
	enabled: false,
	onItemSeen: (_item: PostFeed.FeedRow) => {},
	sendInteraction: (_interaction: AppBskyFeedDefs.Interaction) => {},
	feedDescriptor: undefined,
	feedSourceInfo: undefined,
});
stateContext.displayName = 'FeedFeedbackContext';

export function useFeedFeedback(feedSourceInfo: FeedSourceInfo | undefined, hasSession: boolean) {
	// create once per mount: Logger.create returns a fresh instance each call, so a render-time call would
	// both allocate per render and make any callback depending on it change identity every render.
	const logger = useConstant(() => Logger.create(Logger.Context.FeedFeedback));
	const { appview } = useClients();

	const feed = !!feedSourceInfo && isFeedSourceFeedInfo(feedSourceInfo) ? feedSourceInfo : undefined;

	const isDiscover = isDiscoverFeed(feed?.feedDescriptor);
	const acceptsInteractions = Boolean(isDiscover || feed?.acceptsInteractions);
	const proxyDid = feed?.view?.did;
	const enabled = Boolean(feed) && Boolean(proxyDid) && acceptsInteractions && hasSession;

	const queue = useRef<Set<string>>(new Set());
	const history = useRef<
		// Use a WeakSet so that we don't need to clear it.
		// This assumes that referential identity of slice items maps 1:1 to feed (re)fetches.
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

		// Send to the feed
		ok(
			appview.post('app.bsky.feed.sendInteractions', {
				input: { interactions: interactionsToSend, feed: feed?.uri as ResourceUri | undefined },
				headers: { 'atproto-proxy': `${proxyDid}#bsky_fg` },
			}),
		).catch(() => {}); // ignore upstream errors
	}, [appview, proxyDid, enabled, feed]);

	const sendToFeed = useMemo(
		() =>
			// lodash.throttle stores sendToFeedNoDelay without invoking it, so the queue/history refs
			// below are only read when the throttled function fires from handlers/effects, never during
			// render. the rule can't prove throttle won't call back synchronously, hence the suppression.
			// oxlint-disable-next-line react/react-compiler
			throttle(sendToFeedNoDelay, 10e3, {
				leading: false,
				trailing: true,
			}),
		[sendToFeedNoDelay],
	);

	useEffect(() => {
		if (!enabled) {
			return;
		}
		const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
			if (state === 'background') {
				sendToFeed.flush();
			}
		});
		return () => sub.remove();
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
							item: postItem.uri as ResourceUri,
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
			logger.debug('sendInteraction', {
				...interaction,
			});
			if (!history.current.has(interaction)) {
				history.current.add(interaction);
				queue.current.add(toString(interaction));
				sendToFeed();
			}
		},
		[enabled, logger, sendToFeed],
	);

	return useMemo(() => {
		return {
			enabled,
			// pass this method to the <List> onItemSeen
			onItemSeen,
			// call on various events
			// queues the event to be sent with the throttled sendToFeed call
			sendInteraction,
			feedDescriptor: feed?.feedDescriptor,
			feedSourceInfo: typeof feed === 'object' ? feed : undefined,
		};
	}, [enabled, onItemSeen, sendInteraction, feed]);
}

export const FeedFeedbackProvider = stateContext.Provider;

export function useFeedFeedbackContext() {
	return useContext(stateContext);
}

// TODO
// We will introduce a permissions framework for 3p feeds to
// take advantage of the feed feedback API. Until that's in
// place, we're hardcoding it to the discover feed.
// -prf
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
	return { item, event, feedContext, reqId } as AppBskyFeedDefs.Interaction;
}
