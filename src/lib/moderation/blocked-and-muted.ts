import { type AnyProfileView } from '@atcute/bluesky';

export function isBlockedOrBlocking(profile: AnyProfileView) {
	return profile.viewer?.blockedBy || profile.viewer?.blocking;
}

export function isMuted(profile: AnyProfileView) {
	return profile.viewer?.muted || profile.viewer?.mutedByList;
}
