import type { AppLink } from '#/lib/links/app-url';

import { router } from '#/routes';

/**
 * reads a URL on this app's own origin.
 *
 * @param url the link target, already known to be on our own origin
 * @returns what the URL names, or undefined for a route naming nothing outside this app
 */
export const parseOwnPath = (url: URL): AppLink | undefined => {
	const target = router.match(url.pathname + url.search);
	switch (target?.name) {
		case 'GroupChatJoin': {
			return { code: target.code, kind: 'chat-invite' };
		}
		case 'Hashtag': {
			return { author: target.author, kind: 'hashtag', tag: target.tag };
		}
		case 'PostThread': {
			return { actor: target.actor, kind: 'post', rkey: target.rkey };
		}
		case 'Profile': {
			return { actor: target.actor, kind: 'profile' };
		}
		case 'ProfileFeed': {
			return { actor: target.actor, kind: 'feed', rkey: target.rkey };
		}
		case 'ProfileList': {
			return { actor: target.actor, kind: 'list', rkey: target.rkey };
		}
		case 'Search': {
			return { kind: 'search', query: target.q };
		}
		case 'StarterPack': {
			return { actor: target.actor, kind: 'starter-pack', rkey: target.rkey };
		}
		case 'Topic': {
			return { kind: 'topic', topic: target.topic };
		}
		default: {
			return undefined;
		}
	}
};
