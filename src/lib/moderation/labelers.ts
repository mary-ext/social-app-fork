import type { AppBskyLabelerDefs } from '@atcute/bluesky';
import { BUILTIN_LABELS, type InterpretedLabelDefinition } from '@atcute/bluesky-moderation';
import type { Did } from '@atcute/lexicons';

/** did of the Bluesky-operated moderation labeler, applied as an app labeler. */
export const BSKY_LABELER_DID = 'did:plc:ar7c4by46qjdydhdevvrndac';

/** app-level moderation labeler dids. */
export const APP_LABELERS: readonly Did[] = [BSKY_LABELER_DID];

/**
 * whether a labeler is one this app applies for everyone, rather than one the viewer subscribed to.
 *
 * @param labeler the labeler's did or view
 * @returns whether the labeler is an app labeler
 */
export function isAppLabeler(
	labeler: Did | AppBskyLabelerDefs.LabelerView | AppBskyLabelerDefs.LabelerViewDetailed,
): boolean {
	const did = typeof labeler === 'string' ? labeler : labeler.creator.did;
	return APP_LABELERS.includes(did);
}

/**
 * finds the definition for a label value among a labeler's own definitions, falling back to the built-in
 * ones. `!`-prefixed values are always global, so labeler definitions are skipped for them.
 *
 * @param labelValue the label value
 * @param customDefs the labeler's own definitions
 * @returns the definition, or undefined when the value is unknown
 */
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
