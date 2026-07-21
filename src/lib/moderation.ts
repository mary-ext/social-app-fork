import type { ComAtprotoLabelDefs } from '@atcute/atproto';
import type { AppBskyLabelerDefs } from '@atcute/bluesky';
import {
	BUILTIN_LABELS,
	type DisplayRestrictions,
	type InterpretedLabelDefinition,
	type ModerationCause,
	ModerationCauseType,
	type ModerationOptions,
} from '@atcute/bluesky-moderation';
import type { Did, Handle } from '@atcute/lexicons';

import { getAppLabelers } from '#/lib/moderation/app-labelers';
import { sanitizeDisplayName } from '#/lib/strings/display-names';

import type { AppModerationCause } from '#/components/Pills';

export const ADULT_CONTENT_LABELS = ['sexual', 'nudity', 'porn'] as const;
export const OTHER_SELF_LABELS = ['graphic-media'] as const;
export const SELF_LABELS = [...ADULT_CONTENT_LABELS, ...OTHER_SELF_LABELS] as const;

export type AdultSelfLabel = (typeof ADULT_CONTENT_LABELS)[number];
export type OtherSelfLabel = (typeof OTHER_SELF_LABELS)[number];
export type SelfLabel = (typeof SELF_LABELS)[number];

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

export function getLabelingServiceTitle({ displayName, handle }: { displayName?: string; handle: Handle }) {
	return displayName ? sanitizeDisplayName(displayName) : `@${handle}`;
}

export function lookupLabelValueDefinition(
	labelValue: string,
	customDefs: InterpretedLabelDefinition[] | undefined,
): InterpretedLabelDefinition | undefined {
	let def;
	if (!labelValue.startsWith('!') && customDefs) {
		def = customDefs.find((d) => d.identifier === labelValue);
	}
	if (!def) {
		def = BUILTIN_LABELS[labelValue];
	}
	return def;
}

export function isAppLabeler(
	labeler: Did | AppBskyLabelerDefs.LabelerView | AppBskyLabelerDefs.LabelerViewDetailed,
): boolean {
	if (typeof labeler === 'string') {
		return getAppLabelers().includes(labeler);
	}
	return getAppLabelers().includes(labeler.creator.did);
}

export function isLabelerSubscribed(
	labeler: AppBskyLabelerDefs.LabelerView | AppBskyLabelerDefs.LabelerViewDetailed | Did,
	modOpts: ModerationOptions,
) {
	const did = typeof labeler === 'string' ? labeler : labeler.creator.did;
	if (isAppLabeler(did)) {
		return true;
	}
	return !!modOpts.prefs.prefsByLabelers?.[did];
}

export type Subject =
	| {
			uri: string;
			cid: string;
	  }
	| {
			did: string;
	  };

export function useLabelSubject({ label }: { label: ComAtprotoLabelDefs.Label }): {
	subject: Subject;
} {
	const { cid, uri } = label;
	if (cid) {
		return {
			subject: {
				uri,
				cid,
			},
		};
	} else {
		return {
			subject: {
				did: uri,
			},
		};
	}
}
