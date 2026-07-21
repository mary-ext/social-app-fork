import type { AnyProfileView, AppBskyActorDefs } from '@atcute/bluesky';
import {
	DisplayContext,
	getDisplayRestrictions,
	moderateStatus,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';
import { parseCanonicalResourceUri } from '@atcute/lexicons/syntax';

import { isAfterDate } from '@mary/date-fns';

import { useMaybeProfileShadow } from '#/state/cache/profile-shadow';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useSession } from '#/state/session';
import { useTickEveryMinute } from '#/state/shell';

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
	const tick = useTickEveryMinute();
	const config = useLiveNowConfig();
	const moderationOpts = useModerationOpts();

	const moderation = computeStatusModeration(actor, moderationOpts);

	void tick; // revalidate every minute

	/*
	 * Do not even allow Live Now to show if filtered for `contentList`.
	 */
	if (moderation && getDisplayRestrictions(moderation, DisplayContext.ContentList).filters.length > 0) {
		return DEFAULT_STATE;
	}

	if (shadowed && 'status' in shadowed && shadowed.status) {
		const isValid = isStatusValidForViewers(shadowed.status, config);
		const isDisabled = shadowed.status.isDisabled;
		const isActive = isStatusStillActive(shadowed.status.expiresAt);
		if (isValid && !isDisabled && isActive) {
			return {
				uri: shadowed.status.uri,
				cid: shadowed.status.cid,
				isDisabled: false,
				isActive: true,
				status: 'app.bsky.actor.status#live',
				embed: shadowed.status.embed, // temp_isStatusValid asserts this
				expiresAt: shadowed.status.expiresAt!, // isStatusStillActive asserts this
				record: shadowed.status.record,
			} satisfies AppBskyActorDefs.StatusView;
		}
		return {
			uri: shadowed.status.uri,
			cid: shadowed.status.cid,
			isDisabled,
			isActive: false,
			status: 'app.bsky.actor.status#live',
			embed: shadowed.status.embed, // temp_isStatusValid asserts this
			expiresAt: shadowed.status.expiresAt!, // isStatusStillActive asserts this
			record: shadowed.status.record,
		} satisfies AppBskyActorDefs.StatusView;
	} else {
		return DEFAULT_STATE;
	}
}

export function isStatusStillActive(timeStr: string | undefined) {
	if (!timeStr) {
		return false;
	}
	const now = new Date();
	const expiry = new Date(timeStr);

	return isAfterDate(expiry, now);
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
