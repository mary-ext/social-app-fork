import type { ComAtprotoModerationDefs } from '@atcute/atproto';
import type { ToolsOzoneReportDefs } from '@atcute/ozone';

import { OzoneReason, RootReason } from '#/lib/moderation/report-reasons';

import { type ParsedReportSubject } from '#/components/moderation/ReportDialog/types';

export const SUPPORT_PAGE = 'https://bsky.social/about/support';

/**
 * Mapping of new (Ozone namespace) reason types to old reason types.
 *
 * Matches the mapping defined in the Ozone codebase:
 *
 * @see https://github.com/bluesky-social/atproto/blob/4c15fb47cec26060bff2e710e95869a90c9d7fdd/packages/ozone/src/mod-service/profile.ts#L16-L64
 */
export const NEW_TO_OLD_REASONS_MAP: Record<
	ToolsOzoneReportDefs.ReasonType,
	ComAtprotoModerationDefs.ReasonType
> = {
	[OzoneReason.REASONAPPEAL]: RootReason.REASONAPPEAL,
	[OzoneReason.REASONOTHER]: RootReason.REASONOTHER,

	[OzoneReason.REASONVIOLENCEANIMAL]: RootReason.REASONVIOLATION,
	[OzoneReason.REASONVIOLENCETHREATS]: RootReason.REASONVIOLATION,
	[OzoneReason.REASONVIOLENCEGRAPHICCONTENT]: RootReason.REASONVIOLATION,
	[OzoneReason.REASONVIOLENCEGLORIFICATION]: RootReason.REASONVIOLATION,
	[OzoneReason.REASONVIOLENCEEXTREMISTCONTENT]: RootReason.REASONVIOLATION,
	[OzoneReason.REASONVIOLENCETRAFFICKING]: RootReason.REASONVIOLATION,
	[OzoneReason.REASONVIOLENCEOTHER]: RootReason.REASONVIOLATION,

	[OzoneReason.REASONSEXUALABUSECONTENT]: RootReason.REASONSEXUAL,
	[OzoneReason.REASONSEXUALNCII]: RootReason.REASONSEXUAL,
	[OzoneReason.REASONSEXUALDEEPFAKE]: RootReason.REASONSEXUAL,
	[OzoneReason.REASONSEXUALANIMAL]: RootReason.REASONSEXUAL,
	[OzoneReason.REASONSEXUALUNLABELED]: RootReason.REASONSEXUAL,
	[OzoneReason.REASONSEXUALOTHER]: RootReason.REASONSEXUAL,

	[OzoneReason.REASONCHILDSAFETYCSAM]: RootReason.REASONVIOLATION,
	[OzoneReason.REASONCHILDSAFETYGROOM]: RootReason.REASONVIOLATION,
	[OzoneReason.REASONCHILDSAFETYPRIVACY]: RootReason.REASONVIOLATION,
	[OzoneReason.REASONCHILDSAFETYHARASSMENT]: RootReason.REASONVIOLATION,
	[OzoneReason.REASONCHILDSAFETYOTHER]: RootReason.REASONVIOLATION,

	[OzoneReason.REASONHARASSMENTTROLL]: RootReason.REASONRUDE,
	[OzoneReason.REASONHARASSMENTTARGETED]: RootReason.REASONRUDE,
	[OzoneReason.REASONHARASSMENTHATESPEECH]: RootReason.REASONRUDE,
	[OzoneReason.REASONHARASSMENTDOXXING]: RootReason.REASONRUDE,
	[OzoneReason.REASONHARASSMENTOTHER]: RootReason.REASONRUDE,

	[OzoneReason.REASONMISLEADINGBOT]: RootReason.REASONMISLEADING,
	[OzoneReason.REASONMISLEADINGIMPERSONATION]: RootReason.REASONMISLEADING,
	[OzoneReason.REASONMISLEADINGSPAM]: RootReason.REASONSPAM,
	[OzoneReason.REASONMISLEADINGSCAM]: RootReason.REASONMISLEADING,
	[OzoneReason.REASONMISLEADINGELECTIONS]: RootReason.REASONMISLEADING,
	[OzoneReason.REASONMISLEADINGOTHER]: RootReason.REASONMISLEADING,

	[OzoneReason.REASONRULESITESECURITY]: RootReason.REASONVIOLATION,
	[OzoneReason.REASONRULEPROHIBITEDSALES]: RootReason.REASONVIOLATION,
	[OzoneReason.REASONRULEBANEVASION]: RootReason.REASONVIOLATION,
	[OzoneReason.REASONRULEOTHER]: RootReason.REASONVIOLATION,

	[OzoneReason.REASONSELFHARMCONTENT]: RootReason.REASONVIOLATION,
	[OzoneReason.REASONSELFHARMED]: RootReason.REASONVIOLATION,
	[OzoneReason.REASONSELFHARMSTUNTS]: RootReason.REASONVIOLATION,
	[OzoneReason.REASONSELFHARMSUBSTANCES]: RootReason.REASONVIOLATION,
	[OzoneReason.REASONSELFHARMOTHER]: RootReason.REASONVIOLATION,
};

/** Set of report reasons that should optionally include additional details from the reporter. */
export const OTHER_REPORT_REASONS: Set<ToolsOzoneReportDefs.ReasonType> = new Set([
	OzoneReason.REASONVIOLENCEOTHER,
	OzoneReason.REASONSEXUALOTHER,
	OzoneReason.REASONCHILDSAFETYOTHER,
	OzoneReason.REASONHARASSMENTOTHER,
	OzoneReason.REASONMISLEADINGOTHER,
	OzoneReason.REASONRULEOTHER,
	OzoneReason.REASONSELFHARMOTHER,
	OzoneReason.REASONOTHER,
]);

/** Set of report reasons that should only be sent to Bluesky's moderation service. */
export const BSKY_LABELER_ONLY_REPORT_REASONS: Set<ToolsOzoneReportDefs.ReasonType> = new Set([
	OzoneReason.REASONCHILDSAFETYCSAM,
	OzoneReason.REASONCHILDSAFETYGROOM,
	OzoneReason.REASONCHILDSAFETYOTHER,
	OzoneReason.REASONVIOLENCEEXTREMISTCONTENT,
]);

/** Set of _parsed_ subject types that should only be sent to Bluesky's moderation service. */
export const BSKY_LABELER_ONLY_SUBJECT_TYPES: Set<ParsedReportSubject['type']> = new Set([
	'convoMessage',
	'status',
]);
