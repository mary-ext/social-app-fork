import type { ComAtprotoLabelDefs } from '@atcute/atproto';
import {
	type DisplayRestrictions,
	type ModerationCause,
	ModerationCauseType,
} from '@atcute/bluesky-moderation';

export type AppModerationCause =
	| ModerationCause
	| {
			type: 'reply-hidden';
			source: { type: 'user'; did: string };
			priority: 6;
			downgraded?: boolean;
	  };

function getModerationCauseSourceKey(cause: ModerationCause | AppModerationCause): string {
	switch (cause.type) {
		case 'reply-hidden':
			return cause.source.did;
		case ModerationCauseType.Label:
			return cause.source ?? 'user';
		case ModerationCauseType.Blocking:
		case ModerationCauseType.MutedPermanent:
			return cause.source?.uri ?? 'user';
		case ModerationCauseType.MutedKeyword:
			return cause.source.id ?? 'mute-word';
		default:
			return 'user';
	}
}

export function getModerationCauseKey(cause: ModerationCause | AppModerationCause): string {
	const source = getModerationCauseSourceKey(cause);
	if (cause.type === ModerationCauseType.Label) {
		return `label:${cause.label.val}:${source}`;
	}
	return `${cause.type}:${source}`;
}

export function isJustAMute(modui: DisplayRestrictions): boolean {
	return (
		modui.filters.length === 1 &&
		(modui.filters[0]!.type === ModerationCauseType.MutedPermanent ||
			modui.filters[0]!.type === ModerationCauseType.MutedTemporary)
	);
}

export function moduiContainsHideableOffense(modui: DisplayRestrictions): boolean {
	const cause = modui.filters.at(0);
	if (cause && cause.type === ModerationCauseType.Label) {
		return labelIsHideableOffense(cause.label);
	}
	return false;
}

export function labelIsHideableOffense(label: ComAtprotoLabelDefs.Label): boolean {
	return ['!hide', '!takedown'].includes(label.val);
}
