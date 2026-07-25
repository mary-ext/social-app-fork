import { type AppLink, describeUrl } from '#/lib/links/app-url';
import type { RouteTarget } from '#/lib/routes/target';
import {
	feedTarget,
	listTarget,
	postTarget,
	profileTarget,
	recordUriToTarget,
	starterPackTarget,
} from '#/lib/routes/targets';

import { buildTarget } from '#/routes';

/** maps a link parsed out of a client's URL onto the route that renders it here. */
const appLinkToTarget = (link: AppLink): RouteTarget => {
	switch (link.kind) {
		// a chat invite has a route so the link keeps anchor semantics (opening in a new tab lands on the join
		// screen), but a plain click is intercepted into the join dialog instead.
		case 'chat-invite':
			return { name: 'GroupChatJoin', params: { code: link.code } };
		case 'feed':
			return feedTarget(link.actor, link.rkey);
		case 'hashtag':
			return { name: 'Hashtag', params: { author: link.author, tag: link.tag } };
		case 'list':
			return listTarget(link.actor, link.rkey);
		case 'post':
			return postTarget(link.actor, link.rkey);
		case 'profile':
			return profileTarget(link.actor);
		case 'search':
			return { name: 'Search', params: { q: link.query } };
		case 'starter-pack':
			return starterPackTarget(link.actor, link.rkey);
		case 'topic':
			return { name: 'Topic', params: { topic: link.topic } };
	}
};

// #region inbound

/** an in-app destination resolved from a URL. */
export type ResolvedUrl = {
	/** what the URL names, or undefined for one of our own routes with no meaning outside this app. */
	link: AppLink | undefined;
	/** the in-app path that renders it. */
	path: string;
};

/**
 * resolves a URL to the in-app destination that renders it, if any. our own URLs pass through whole, so one
 * with no route lands on the not-found screen rather than escaping to a new tab; another client's URL is
 * rebuilt against our route tree. use `resolveUrlToLink` to only ask what a link names.
 *
 * @param url the raw link target
 * @returns the destination, or undefined when the link belongs to the open web
 */
export const resolveUrl = (url: string): ResolvedUrl | undefined => {
	const target = describeUrl(url);
	switch (target?.kind) {
		case 'client':
			return { link: target.link, path: buildTarget(appLinkToTarget(target.link)) };
		case 'own':
			return { link: target.link, path: target.path };
		default:
			return undefined;
	}
};

// #endregion

// #region outbound

/**
 * the absolute URL for an in-app destination, for sharing it outside the app.
 *
 * @param target the in-app destination
 * @returns the absolute URL on this app's own origin
 */
export const targetToShareUrl = (target: RouteTarget): string => {
	return new URL(buildTarget(target), location.origin).toString();
};

/**
 * the absolute URL for the record an at-uri names.
 *
 * @param uri the record's at-uri
 * @returns the URL, or undefined when the uri is malformed or names a record with no screen here
 */
export const recordUriToShareUrl = (uri: string): string | undefined => {
	const target = recordUriToTarget(uri);
	return target && targetToShareUrl(target);
};

// #endregion
