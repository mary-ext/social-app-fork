import type { ToolsOzoneReportDefs } from '@atcute/ozone';

import { OzoneReason } from '#/lib/moderation/report-reasons';

import { m } from '#/paraglide/messages';

export type ReportCategory =
	| 'childSafety'
	| 'violencePhysicalHarm'
	| 'sexualAdultContent'
	| 'harassmentHate'
	| 'misleading'
	| 'ruleBreaking'
	| 'selfHarm'
	| 'other';

export type ReportCategoryConfig = {
	key: ReportCategory;
	title: string;
	description: string;
	options: ReportOption[];
};

export type ReportOption = {
	title: string;
	reason: ToolsOzoneReportDefs.ReasonType;
};

export function useReportOptions() {
	const categories: Record<ReportCategory, ReportCategoryConfig> = {
		misleading: {
			key: 'misleading',
			title: m['components.moderation.reason.misleading'](),
			description: m['components.moderation.reason.spamDesc'](),
			options: [
				{
					title: m['components.moderation.reason.spam'](),
					reason: OzoneReason.REASONMISLEADINGSPAM,
				},
				{
					title: m['components.moderation.reason.scam'](),
					reason: OzoneReason.REASONMISLEADINGSCAM,
				},
				{
					title: m['components.moderation.reason.fakeAccount'](),
					reason: OzoneReason.REASONMISLEADINGBOT,
				},
				{
					title: m['components.moderation.reason.impersonation'](),
					reason: OzoneReason.REASONMISLEADINGIMPERSONATION,
				},
				{
					title: m['components.moderation.reason.electionMisinfo'](),
					reason: OzoneReason.REASONMISLEADINGELECTIONS,
				},
				{
					title: m['components.moderation.reason.otherMisleading'](),
					reason: OzoneReason.REASONMISLEADINGOTHER,
				},
			],
		},
		sexualAdultContent: {
			key: 'sexualAdultContent',
			title: m['components.moderation.reason.adultContent'](),
			description: m['components.moderation.reason.unlabeledAdultDesc'](),
			options: [
				{
					title: m['components.moderation.reason.unlabeledAdult'](),
					reason: OzoneReason.REASONSEXUALUNLABELED,
				},
				{
					title: m['components.moderation.reason.adultSexualAbuse'](),
					reason: OzoneReason.REASONSEXUALABUSECONTENT,
				},
				{
					title: m['components.moderation.reason.ncii'](),
					reason: OzoneReason.REASONSEXUALNCII,
				},
				{
					title: m['components.moderation.reason.deepfakeAdult'](),
					reason: OzoneReason.REASONSEXUALDEEPFAKE,
				},
				{
					title: m['components.moderation.reason.animalSexualAbuse'](),
					reason: OzoneReason.REASONSEXUALANIMAL,
				},
				{
					title: m['components.moderation.reason.otherSexualViolence'](),
					reason: OzoneReason.REASONSEXUALOTHER,
				},
			],
		},
		harassmentHate: {
			key: 'harassmentHate',
			title: m['components.moderation.reason.harassment'](),
			description: m['components.moderation.reason.abusiveBehavior'](),
			options: [
				{
					title: m['components.moderation.reason.trolling'](),
					reason: OzoneReason.REASONHARASSMENTTROLL,
				},
				{
					title: m['components.moderation.reason.targetedHarassment'](),
					reason: OzoneReason.REASONHARASSMENTTARGETED,
				},
				{
					title: m['components.moderation.reason.hateSpeech'](),
					reason: OzoneReason.REASONHARASSMENTHATESPEECH,
				},
				{
					title: m['components.moderation.reason.doxxing'](),
					reason: OzoneReason.REASONHARASSMENTDOXXING,
				},
				{
					title: m['components.moderation.reason.otherHarassment'](),
					reason: OzoneReason.REASONHARASSMENTOTHER,
				},
			],
		},
		violencePhysicalHarm: {
			key: 'violencePhysicalHarm',
			title: m['components.moderation.reason.violence'](),
			description: m['components.moderation.reason.violenceDesc'](),
			options: [
				{
					title: m['components.moderation.reason.animalWelfare'](),
					reason: OzoneReason.REASONVIOLENCEANIMAL,
				},
				{
					title: m['components.moderation.reason.threats'](),
					reason: OzoneReason.REASONVIOLENCETHREATS,
				},
				{
					title: m['components.moderation.reason.graphicViolence'](),
					reason: OzoneReason.REASONVIOLENCEGRAPHICCONTENT,
				},
				{
					title: m['components.moderation.reason.glorificationViolence'](),
					reason: OzoneReason.REASONVIOLENCEGLORIFICATION,
				},
				{
					title: m['components.moderation.reason.extremistContent'](),
					reason: OzoneReason.REASONVIOLENCEEXTREMISTCONTENT,
				},
				{
					title: m['components.moderation.reason.humanTrafficking'](),
					reason: OzoneReason.REASONVIOLENCETRAFFICKING,
				},
				{
					title: m['components.moderation.reason.otherViolent'](),
					reason: OzoneReason.REASONVIOLENCEOTHER,
				},
			],
		},
		childSafety: {
			key: 'childSafety',
			title: m['components.moderation.reason.childSafety'](),
			description: m['components.moderation.reason.endangeringMinors'](),
			options: [
				{
					title: m['components.moderation.reason.csam'](),
					reason: OzoneReason.REASONCHILDSAFETYCSAM,
				},
				{
					title: m['components.moderation.reason.grooming'](),
					reason: OzoneReason.REASONCHILDSAFETYGROOM,
				},
				{
					title: m['components.moderation.reason.minorPrivacy'](),
					reason: OzoneReason.REASONCHILDSAFETYPRIVACY,
				},
				{
					title: m['components.moderation.reason.minorHarassment'](),
					reason: OzoneReason.REASONCHILDSAFETYHARASSMENT,
				},
				{
					title: m['components.moderation.reason.otherChildSafety'](),
					reason: OzoneReason.REASONCHILDSAFETYOTHER,
				},
			],
		},
		selfHarm: {
			key: 'selfHarm',
			title: m['components.moderation.reason.selfHarm'](),
			description: m['components.moderation.reason.harmfulActivities'](),
			options: [
				{
					title: m['components.moderation.reason.selfHarmContent'](),
					reason: OzoneReason.REASONSELFHARMCONTENT,
				},
				{
					title: m['components.moderation.reason.eatingDisorders'](),
					reason: OzoneReason.REASONSELFHARMED,
				},
				{
					title: m['components.moderation.reason.dangerousChallenges'](),
					reason: OzoneReason.REASONSELFHARMSTUNTS,
				},
				{
					title: m['components.moderation.reason.dangerousSubstances'](),
					reason: OzoneReason.REASONSELFHARMSUBSTANCES,
				},
				{
					title: m['components.moderation.reason.otherDangerous'](),
					reason: OzoneReason.REASONSELFHARMOTHER,
				},
			],
		},
		ruleBreaking: {
			key: 'ruleBreaking',
			title: m['components.moderation.reason.breakingSiteRules'](),
			description: m['components.moderation.reason.bannedActivities'](),
			options: [
				{
					title: m['components.moderation.reason.hacking'](),
					reason: OzoneReason.REASONRULESITESECURITY,
				},
				{
					title: m['components.moderation.reason.prohibitedItems'](),
					reason: OzoneReason.REASONRULEPROHIBITEDSALES,
				},
				{
					title: m['components.moderation.reason.bannedUserReturning'](),
					reason: OzoneReason.REASONRULEBANEVASION,
				},
				{
					title: m['components.moderation.reason.otherNetworkRule'](),
					reason: OzoneReason.REASONRULEOTHER,
				},
			],
		},
		other: {
			key: 'other',
			title: m['common.status.other'](),
			description: m['components.moderation.reason.other'](),
			options: [
				{
					title: m['common.status.other'](),
					reason: OzoneReason.REASONOTHER,
				},
			],
		},
	};

	return {
		categories: Object.values(categories),
		getCategory: (reasonName: ReportCategory) => categories[reasonName],
	};
}
