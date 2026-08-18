import type { AppLink } from '#/lib/links/app-url';

import { getRouter } from '#/router';

/**
 * reads a URL on this app's own origin.
 *
 * @param url the link target, already known to be on our own origin
 * @returns what the URL names, or undefined for a route naming nothing outside this app
 */
export const parseOwnPath = (url: URL): AppLink | undefined => {
	const target = getRouter().match(url.pathname + url.search);
	switch (target?.name) {
		case 'CustomFeed': {
			return { kind: 'feed', actor: target.actor, rkey: target.rkey };
		}
		case 'GroupChatJoin': {
			return { kind: 'chatInvite', code: target.code };
		}
		case 'Hashtag': {
			return { kind: 'hashtag', author: target.author, tag: target.tag };
		}
		case 'PostThread': {
			return { kind: 'post', actor: target.actor, rkey: target.rkey };
		}
		case 'Profile': {
			return { kind: 'profile', actor: target.actor };
		}
		case 'ProfileList': {
			return { kind: 'list', actor: target.actor, rkey: target.rkey };
		}
		case 'Search': {
			return { kind: 'search', query: target.q };
		}
		case 'StarterPack': {
			return { kind: 'starterPack', actor: target.actor, rkey: target.rkey };
		}
		case 'StarterPackShort': {
			return { kind: 'bskyStarterPackCode', code: target.code };
		}
		case 'Topic': {
			return { kind: 'topic', topic: target.topic };
		}
		default: {
			return undefined;
		}
	}
};
