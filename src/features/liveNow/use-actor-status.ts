import type { AnyProfileView, AppBskyActorDefs } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateStatus,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { useMaybeProfileShadow } from '#/state/cache/profile-shadow';
import { useModerationOpts } from '#/state/moderation/moderation-opts';
import { useSession } from '#/state/session';
import { useTick } from '#/state/tick';

import { isLiveNowUrlAllowed } from '#/features/liveNow/utils';

export const DEFAULT_ALLOWED_DOMAINS = [
	'beehiiv.com',
	'bluecast.app',
	'stream.place',
	'substack.com',
	'twitch.tv',
	'youtube.com',
];

const DEFAULT_STATE = {
	status: '',
	isDisabled: false,
	isActive: false,
	record: {},
} satisfies AppBskyActorDefs.StatusView;

const LIVE_NOW_WORKER_CONFIG: {
	allow: string[];
	exceptions: {
		did: string;
		allow: string[];
	}[];
} = {
	allow: [],
	exceptions: [],
};

export type LiveNowConfig = {
	canGoLive: boolean;
	currentAccountAllowedHosts: Set<string>;
	defaultAllowedHosts: Set<string>;
	allowedHostsExceptionsByDid: Map<string, Set<string>>;
};

export function useLiveNowConfig(): LiveNowConfig {
	const { currentAccount } = useSession();

	const defaultAllowedHosts = new Set(DEFAULT_ALLOWED_DOMAINS.concat(LIVE_NOW_WORKER_CONFIG.allow));
	const allowedHostsExceptionsByDid = new Map<string, Set<string>>();
	for (const ex of LIVE_NOW_WORKER_CONFIG.exceptions) {
		allowedHostsExceptionsByDid.set(ex.did, new Set(DEFAULT_ALLOWED_DOMAINS.concat(ex.allow)));
	}

	if (!currentAccount?.did) {
		return {
			canGoLive: false,
			currentAccountAllowedHosts: new Set(),
			defaultAllowedHosts,
			allowedHostsExceptionsByDid,
		};
	}

	return {
		canGoLive: true,
		currentAccountAllowedHosts: allowedHostsExceptionsByDid.get(currentAccount.did) ?? defaultAllowedHosts,
		defaultAllowedHosts,
		allowedHostsExceptionsByDid,
	};
}

function computeStatusModeration(
	actor: AnyProfileView | undefined,
	moderationOpts: ModerationOptions | undefined,
) {
	if (!actor || !('status' in actor && actor.status)) {
		return undefined;
	}
	if (!moderationOpts) {
		return undefined;
	}
	return moderateStatus(actor, moderationOpts);
}

export function useActorStatus(actor?: AnyProfileView) {
	const shadowed = useMaybeProfileShadow(actor);
	const config = useLiveNowConfig();
	const moderationOpts = useModerationOpts();

	const status = shadowed && 'status' in shadowed ? shadowed.status : undefined;

	// only subscribe while status expiry needs revalidation.
	const tick = useTick(!!status);

	const moderation = computeStatusModeration(actor, moderationOpts);

	void tick; // revalidate as time passes

	/*
	 * Do not even allow Live Now to show if filtered for `contentList`.
	 */
	if (moderation && getDisplayRestrictions(moderation, DisplayContext.ContentList).filters.length > 0) {
		return DEFAULT_STATE;
	}

	if (status) {
		const isValid = isStatusValidForViewers(status, config);
		const isDisabled = status.isDisabled;
		const isActive = isStatusStillActive(status.expiresAt);
		if (isValid && !isDisabled && isActive) {
			return {
				status: 'app.bsky.actor.status#live',
				cid: status.cid,
				uri: status.uri,
				embed: status.embed, // temp_isStatusValid asserts this
				expiresAt: status.expiresAt!, // isStatusStillActive asserts this
				isActive: true,
				isDisabled: false,
				record: status.record,
			} satisfies AppBskyActorDefs.StatusView;
		}
		return {
			status: 'app.bsky.actor.status#live',
			cid: status.cid,
			uri: status.uri,
			embed: status.embed, // temp_isStatusValid asserts this
			expiresAt: status.expiresAt!, // isStatusStillActive asserts this
			isActive: false,
			isDisabled,
			record: status.record,
		} satisfies AppBskyActorDefs.StatusView;
	} else {
		return DEFAULT_STATE;
	}
}

export function isStatusStillActive(timeStr: string | undefined) {
	if (!timeStr) {
		return false;
	}

	return Date.parse(timeStr) > Date.now();
}

/**
 * validates whether the live status is valid for display in the app. does not validate if the status is valid
 * for the acting user.
 */
export function isStatusValidForViewers(status: AppBskyActorDefs.StatusView, config: LiveNowConfig) {
	if (status.status !== 'app.bsky.actor.status#live') {
		return false;
	}
	if (!status.uri) {
		return false;
	} // should not happen, just backwards compat
	try {
		const { repo: liveDid } = parseCanonicalResourceUri(status.uri);
		if (status.embed?.$type === 'app.bsky.embed.external#view') {
			const url = status.embed.external.uri;
			const exception = config.allowedHostsExceptionsByDid.get(liveDid);
			const isValidException = exception ? isLiveNowUrlAllowed(url, exception) : false;
			const isValidForAnyone = isLiveNowUrlAllowed(url, config.defaultAllowedHosts);
			return isValidException || isValidForAnyone;
		} else {
			return false;
		}
	} catch {
		return false;
	}
}
