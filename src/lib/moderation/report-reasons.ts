import type { ComAtprotoModerationDefs } from '@atcute/atproto';
import type { ToolsOzoneReportDefs } from '@atcute/ozone';

/**
 * Report-reason value constants.
 *
 * `@atcute/ozone` and `@atcute/atproto` expose report reasons only as schemas and types — there are no value
 * constants like `@atproto/api`'s `ToolsOzoneReportDefs.REASONAPPEAL`. The literal NSID strings are named
 * here, typed against `@atcute`'s `ReasonType` unions.
 */

/** `tools.ozone.report.defs` reason values — the granular reason set. */
export const OzoneReason = {
	REASONAPPEAL: 'tools.ozone.report.defs#reasonAppeal',
	REASONCHILDSAFETYCSAM: 'tools.ozone.report.defs#reasonChildSafetyCSAM',
	REASONCHILDSAFETYGROOM: 'tools.ozone.report.defs#reasonChildSafetyGroom',
	REASONCHILDSAFETYHARASSMENT: 'tools.ozone.report.defs#reasonChildSafetyHarassment',
	REASONCHILDSAFETYOTHER: 'tools.ozone.report.defs#reasonChildSafetyOther',
	REASONCHILDSAFETYPRIVACY: 'tools.ozone.report.defs#reasonChildSafetyPrivacy',
	REASONHARASSMENTDOXXING: 'tools.ozone.report.defs#reasonHarassmentDoxxing',
	REASONHARASSMENTHATESPEECH: 'tools.ozone.report.defs#reasonHarassmentHateSpeech',
	REASONHARASSMENTOTHER: 'tools.ozone.report.defs#reasonHarassmentOther',
	REASONHARASSMENTTARGETED: 'tools.ozone.report.defs#reasonHarassmentTargeted',
	REASONHARASSMENTTROLL: 'tools.ozone.report.defs#reasonHarassmentTroll',
	REASONMISLEADINGBOT: 'tools.ozone.report.defs#reasonMisleadingBot',
	REASONMISLEADINGELECTIONS: 'tools.ozone.report.defs#reasonMisleadingElections',
	REASONMISLEADINGIMPERSONATION: 'tools.ozone.report.defs#reasonMisleadingImpersonation',
	REASONMISLEADINGOTHER: 'tools.ozone.report.defs#reasonMisleadingOther',
	REASONMISLEADINGSCAM: 'tools.ozone.report.defs#reasonMisleadingScam',
	REASONMISLEADINGSPAM: 'tools.ozone.report.defs#reasonMisleadingSpam',
	REASONOTHER: 'tools.ozone.report.defs#reasonOther',
	REASONRULEBANEVASION: 'tools.ozone.report.defs#reasonRuleBanEvasion',
	REASONRULEOTHER: 'tools.ozone.report.defs#reasonRuleOther',
	REASONRULEPROHIBITEDSALES: 'tools.ozone.report.defs#reasonRuleProhibitedSales',
	REASONRULESITESECURITY: 'tools.ozone.report.defs#reasonRuleSiteSecurity',
	REASONSELFHARMCONTENT: 'tools.ozone.report.defs#reasonSelfHarmContent',
	REASONSELFHARMED: 'tools.ozone.report.defs#reasonSelfHarmED',
	REASONSELFHARMOTHER: 'tools.ozone.report.defs#reasonSelfHarmOther',
	REASONSELFHARMSTUNTS: 'tools.ozone.report.defs#reasonSelfHarmStunts',
	REASONSELFHARMSUBSTANCES: 'tools.ozone.report.defs#reasonSelfHarmSubstances',
	REASONSEXUALABUSECONTENT: 'tools.ozone.report.defs#reasonSexualAbuseContent',
	REASONSEXUALANIMAL: 'tools.ozone.report.defs#reasonSexualAnimal',
	REASONSEXUALDEEPFAKE: 'tools.ozone.report.defs#reasonSexualDeepfake',
	REASONSEXUALNCII: 'tools.ozone.report.defs#reasonSexualNCII',
	REASONSEXUALOTHER: 'tools.ozone.report.defs#reasonSexualOther',
	REASONSEXUALUNLABELED: 'tools.ozone.report.defs#reasonSexualUnlabeled',
	REASONVIOLENCEANIMAL: 'tools.ozone.report.defs#reasonViolenceAnimal',
	REASONVIOLENCEEXTREMISTCONTENT: 'tools.ozone.report.defs#reasonViolenceExtremistContent',
	REASONVIOLENCEGLORIFICATION: 'tools.ozone.report.defs#reasonViolenceGlorification',
	REASONVIOLENCEGRAPHICCONTENT: 'tools.ozone.report.defs#reasonViolenceGraphicContent',
	REASONVIOLENCEOTHER: 'tools.ozone.report.defs#reasonViolenceOther',
	REASONVIOLENCETHREATS: 'tools.ozone.report.defs#reasonViolenceThreats',
	REASONVIOLENCETRAFFICKING: 'tools.ozone.report.defs#reasonViolenceTrafficking',
} as const satisfies Record<string, ToolsOzoneReportDefs.ReasonType>;

/** `com.atproto.moderation.defs` reason values — the legacy reason set, for older labelers. */
export const RootReason = {
	REASONAPPEAL: 'com.atproto.moderation.defs#reasonAppeal',
	REASONMISLEADING: 'com.atproto.moderation.defs#reasonMisleading',
	REASONOTHER: 'com.atproto.moderation.defs#reasonOther',
	REASONRUDE: 'com.atproto.moderation.defs#reasonRude',
	REASONSEXUAL: 'com.atproto.moderation.defs#reasonSexual',
	REASONSPAM: 'com.atproto.moderation.defs#reasonSpam',
	REASONVIOLATION: 'com.atproto.moderation.defs#reasonViolation',
} as const satisfies Record<string, ComAtprotoModerationDefs.ReasonType>;
