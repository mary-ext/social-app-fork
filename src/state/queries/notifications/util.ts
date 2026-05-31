import {
	type AnyProfileView,
	type AppBskyFeedDefs,
	type AppBskyFeedLike,
	type AppBskyFeedPost,
	type AppBskyFeedRepost,
	type AppBskyGraphDefs,
	type AppBskyNotificationListNotifications,
} from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';
import { type ResourceUri } from '@atcute/lexicons';
import { type QueryClient } from '@tanstack/react-query';
import chunk from 'lodash.chunk';

import { labelIsHideableOffense } from '#/lib/moderation';
import { hasMutedWord, moderateNotification, type ModerationOpts } from '#/lib/moderation/compat';

import { precacheProfile } from '../profile';
import { type FeedNotification, type FeedPage, type NotificationType } from './types';

const GROUPABLE_REASONS = [
	'like',
	'repost',
	'follow',
	'like-via-repost',
	'repost-via-repost',
	'subscribed-post',
];
const MS_1HR = 1e3 * 60 * 60;
const MS_2DAY = MS_1HR * 48;

// exported api
// =

export async function fetchPage({
	appview,
	cursor,
	limit,
	queryClient,
	moderationOpts,
	fetchAdditionalData,
	reasons,
}: {
	appview: Client;
	cursor: string | undefined;
	limit: number;
	queryClient: QueryClient;
	moderationOpts: ModerationOpts | undefined;
	fetchAdditionalData: boolean;
	reasons: string[];
}): Promise<{
	page: FeedPage;
	indexedAt: string | undefined;
}> {
	const data = await ok(
		appview.get('app.bsky.notification.listNotifications', {
			params: {
				limit,
				cursor,
				reasons,
			},
		}),
	);

	const indexedAt = data.notifications[0]?.indexedAt;

	// filter out notifs by mod rules
	const notifs = data.notifications.filter((notif) => !shouldFilterNotif(notif, moderationOpts));

	// group notifications which are essentially similar (follows, likes on a post)
	let notifsGrouped = groupNotifications(notifs);

	// we fetch subjects of notifications (usually posts) now instead of lazily
	// in the UI to avoid relayouts
	if (fetchAdditionalData) {
		const subjects = await fetchSubjects(appview, notifsGrouped);
		for (const notif of notifsGrouped) {
			if (notif.subjectUri) {
				if (notif.type === 'starterpack-joined' && notif.notification.reasonSubject) {
					notif.subject = subjects.starterPacks.get(notif.notification.reasonSubject);
				} else {
					notif.subject = subjects.posts.get(notif.subjectUri);
					if (notif.subject) {
						// TODO(atcute Phase 2.4): drop cast once PostView flips to @atcute types
						precacheProfile(queryClient, notif.subject.author as AnyProfileView);
					}
				}
			}
		}
	}

	let seenAt = data.seenAt ? new Date(data.seenAt) : new Date();
	if (Number.isNaN(seenAt.getTime())) {
		seenAt = new Date();
	}

	return {
		page: {
			cursor: data.cursor,
			seenAt,
			items: notifsGrouped,
			priority: data.priority ?? false,
		},
		indexedAt,
	};
}

// internal methods
// =

export function shouldFilterNotif(
	notif: AppBskyNotificationListNotifications.Notification,
	moderationOpts: ModerationOpts | undefined,
): boolean {
	const containsImperative = !!notif.author.labels?.some((label) =>
		labelIsHideableOffense(label as unknown as Parameters<typeof labelIsHideableOffense>[0]),
	);
	if (containsImperative) {
		return true;
	}
	if (!moderationOpts) {
		return false;
	}
	if (notif.reason === 'subscribed-post') {
		const record = notif.record as AppBskyFeedPost.Main;
		if (
			hasMutedWord({
				mutedWords: moderationOpts.prefs.mutedWords,
				text: record.text,
				facets: record.facets,
				outlineTags: record.tags,
				languages: record.langs,
				actor: notif.author,
			})
		) {
			return true;
		}
	}
	if (notif.author.viewer?.following) {
		return false;
	}
	return moderateNotification(notif, moderationOpts).ui('contentList').filter;
}

export function groupNotifications(
	notifs: AppBskyNotificationListNotifications.Notification[],
): FeedNotification[] {
	const groupedNotifs: FeedNotification[] = [];
	for (const notif of notifs) {
		const ts = +new Date(notif.indexedAt);
		let grouped = false;
		if (GROUPABLE_REASONS.includes(notif.reason)) {
			for (const groupedNotif of groupedNotifs) {
				const ts2 = +new Date(groupedNotif.notification.indexedAt);
				if (
					Math.abs(ts2 - ts) < MS_2DAY &&
					notif.reason === groupedNotif.notification.reason &&
					notif.reasonSubject === groupedNotif.notification.reasonSubject &&
					(notif.author.did !== groupedNotif.notification.author.did || notif.reason === 'subscribed-post')
				) {
					const nextIsFollowBack = notif.reason === 'follow' && notif.author.viewer?.following;
					const prevIsFollowBack =
						groupedNotif.notification.reason === 'follow' &&
						groupedNotif.notification.author.viewer?.following;
					const shouldUngroup = nextIsFollowBack || prevIsFollowBack;
					if (!shouldUngroup) {
						groupedNotif.additional = groupedNotif.additional || [];
						groupedNotif.additional.push(notif);
						grouped = true;
						break;
					}
				}
			}
		}
		if (!grouped) {
			const type = toKnownType(notif);
			if (type !== 'starterpack-joined') {
				groupedNotifs.push({
					_reactKey: `notif-${notif.uri}-${notif.reason}`,
					type,
					notification: notif,
					subjectUri: getSubjectUri(type, notif),
				});
			} else {
				groupedNotifs.push({
					_reactKey: `notif-${notif.uri}-${notif.reason}`,
					type: 'starterpack-joined',
					notification: notif,
					subjectUri: notif.uri,
				});
			}
		}
	}
	return groupedNotifs;
}

async function fetchSubjects(
	appview: Client,
	groupedNotifs: FeedNotification[],
): Promise<{
	posts: Map<string, AppBskyFeedDefs.PostView>;
	starterPacks: Map<string, AppBskyGraphDefs.StarterPackViewBasic>;
}> {
	const postUris = new Set<string>();
	const packUris = new Set<string>();
	for (const notif of groupedNotifs) {
		if (notif.subjectUri?.includes('app.bsky.feed.post')) {
			postUris.add(notif.subjectUri);
		} else if (notif.notification.reasonSubject?.includes('app.bsky.graph.starterpack')) {
			packUris.add(notif.notification.reasonSubject);
		}
	}
	const postUriChunks = chunk(Array.from(postUris), 25);
	const packUriChunks = chunk(Array.from(packUris), 25);
	const postsChunks = await Promise.all(
		postUriChunks.map((uris) =>
			ok(appview.get('app.bsky.feed.getPosts', { params: { uris: uris as ResourceUri[] } })).then(
				(data) => data.posts,
			),
		),
	);
	const packsChunks = await Promise.all(
		packUriChunks.map((uris) =>
			ok(appview.get('app.bsky.graph.getStarterPacks', { params: { uris: uris as ResourceUri[] } })).then(
				(data) => data.starterPacks,
			),
		),
	);
	const postsMap = new Map<string, AppBskyFeedDefs.PostView>();
	const packsMap = new Map<string, AppBskyGraphDefs.StarterPackViewBasic>();
	for (const post of postsChunks.flat()) {
		postsMap.set(post.uri, post);
	}
	for (const pack of packsChunks.flat()) {
		packsMap.set(pack.uri, pack);
	}
	return {
		posts: postsMap,
		starterPacks: packsMap,
	};
}

function toKnownType(notif: AppBskyNotificationListNotifications.Notification): NotificationType {
	if (notif.reason === 'like') {
		if (notif.reasonSubject?.includes('feed.generator')) {
			return 'feedgen-like';
		}
		return 'post-like';
	}
	if (
		notif.reason === 'repost' ||
		notif.reason === 'mention' ||
		notif.reason === 'reply' ||
		notif.reason === 'quote' ||
		notif.reason === 'follow' ||
		notif.reason === 'starterpack-joined' ||
		notif.reason === 'verified' ||
		notif.reason === 'unverified' ||
		notif.reason === 'like-via-repost' ||
		notif.reason === 'repost-via-repost' ||
		notif.reason === 'subscribed-post' ||
		notif.reason === 'contact-match'
	) {
		return notif.reason as NotificationType;
	}
	return 'unknown';
}

function getSubjectUri(
	type: NotificationType,
	notif: AppBskyNotificationListNotifications.Notification,
): string | undefined {
	if (type === 'reply' || type === 'quote' || type === 'mention' || type === 'subscribed-post') {
		return notif.uri;
	} else if (
		type === 'post-like' ||
		type === 'repost' ||
		type === 'like-via-repost' ||
		type === 'repost-via-repost'
	) {
		const record = notif.record as AppBskyFeedLike.Main | AppBskyFeedRepost.Main;
		return typeof record.subject?.uri === 'string' ? record.subject.uri : undefined;
	} else if (type === 'feedgen-like') {
		return notif.reasonSubject;
	}
}
