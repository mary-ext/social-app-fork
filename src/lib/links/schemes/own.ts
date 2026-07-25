import {
	type ActorIdentifier,
	isActorIdentifier,
	isRecordKey,
	type RecordKey,
} from '@atcute/lexicons/syntax';

import type { AppLink } from '#/lib/links/app-url';

import { router } from '#/routes';

type Params = Readonly<Record<string, unknown>>;

// a match erases the codecs' types, so these recover them.

const actorOf = (value: unknown): ActorIdentifier | undefined => {
	return isActorIdentifier(value) ? value : undefined;
};

const stringOf = (value: unknown): string | undefined => {
	return typeof value === 'string' ? value : undefined;
};

const recordOf = (params: Params): { actor: ActorIdentifier; rkey: RecordKey } | undefined => {
	const { actor, rkey } = params;
	return isActorIdentifier(actor) && isRecordKey(rkey) ? { actor, rkey } : undefined;
};

/**
 * reads a URL on this app's own origin.
 *
 * @param url the link target, already known to be on our own origin
 * @returns what the URL names, or undefined for a route naming nothing outside this app
 */
export const parseOwnPath = (url: URL): AppLink | undefined => {
	const match = router.match(url.pathname + url.search);
	if (match === undefined) {
		return undefined;
	}

	const { params } = match;
	switch (match.name) {
		case 'GroupChatJoin': {
			const code = stringOf(params.code);
			return code !== undefined ? { code, kind: 'chat-invite' } : undefined;
		}
		case 'Hashtag': {
			const tag = stringOf(params.tag);
			return tag !== undefined ? { author: actorOf(params.author), kind: 'hashtag', tag } : undefined;
		}
		case 'PostThread': {
			const record = recordOf(params);
			return record && { ...record, kind: 'post' };
		}
		case 'Profile': {
			const actor = actorOf(params.actor);
			return actor !== undefined ? { actor, kind: 'profile' } : undefined;
		}
		case 'ProfileFeed': {
			const record = recordOf(params);
			return record && { ...record, kind: 'feed' };
		}
		case 'ProfileList': {
			const record = recordOf(params);
			return record && { ...record, kind: 'list' };
		}
		case 'Search': {
			const query = stringOf(params.q);
			return query !== undefined ? { kind: 'search', query } : undefined;
		}
		case 'StarterPack': {
			const record = recordOf(params);
			return record && { ...record, kind: 'starter-pack' };
		}
		case 'Topic': {
			const topic = stringOf(params.topic);
			return topic !== undefined ? { kind: 'topic', topic } : undefined;
		}
	}

	return undefined;
};
