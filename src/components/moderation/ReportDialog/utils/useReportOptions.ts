import type { ToolsOzoneReportDefs } from '@atcute/ozone';
import { useLingui } from '@lingui/react/macro';

import { OzoneReason } from '#/lib/moderation/report-reasons';

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
	const { t: l } = useLingui();

	const categories: Record<ReportCategory, ReportCategoryConfig> = {
		misleading: {
			key: 'misleading',
			title: l`Misleading`,
			description: l`Spam or other inauthentic behavior or deception`,
			options: [
				{
					title: l`Spam`,
					reason: OzoneReason.REASONMISLEADINGSPAM,
				},
				{
					title: l`Scam`,
					reason: OzoneReason.REASONMISLEADINGSCAM,
				},
				{
					title: l`Fake account or bot`,
					reason: OzoneReason.REASONMISLEADINGBOT,
				},
				{
					title: l`Impersonation`,
					reason: OzoneReason.REASONMISLEADINGIMPERSONATION,
				},
				{
					title: l`False information about elections`,
					reason: OzoneReason.REASONMISLEADINGELECTIONS,
				},
				{
					title: l`Other misleading content`,
					reason: OzoneReason.REASONMISLEADINGOTHER,
				},
			],
		},
		sexualAdultContent: {
			key: 'sexualAdultContent',
			title: l`Adult content`,
			description: l`Unlabeled, abusive, or non-consensual adult content`,
			options: [
				{
					title: l`Unlabeled adult content`,
					reason: OzoneReason.REASONSEXUALUNLABELED,
				},
				{
					title: l`Adult sexual abuse content`,
					reason: OzoneReason.REASONSEXUALABUSECONTENT,
				},
				{
					title: l`Non-consensual intimate imagery`,
					reason: OzoneReason.REASONSEXUALNCII,
				},
				{
					title: l`Deepfake adult content`,
					reason: OzoneReason.REASONSEXUALDEEPFAKE,
				},
				{
					title: l`Animal sexual abuse`,
					reason: OzoneReason.REASONSEXUALANIMAL,
				},
				{
					title: l`Other sexual violence content`,
					reason: OzoneReason.REASONSEXUALOTHER,
				},
			],
		},
		harassmentHate: {
			key: 'harassmentHate',
			title: l`Harassment or hate`,
			description: l`Abusive or discriminatory behavior`,
			options: [
				{
					title: l`Trolling`,
					reason: OzoneReason.REASONHARASSMENTTROLL,
				},
				{
					title: l`Targeted harassment`,
					reason: OzoneReason.REASONHARASSMENTTARGETED,
				},
				{
					title: l`Hate speech`,
					reason: OzoneReason.REASONHARASSMENTHATESPEECH,
				},
				{
					title: l`Doxxing`,
					reason: OzoneReason.REASONHARASSMENTDOXXING,
				},
				{
					title: l`Other harassing or hateful content`,
					reason: OzoneReason.REASONHARASSMENTOTHER,
				},
			],
		},
		violencePhysicalHarm: {
			key: 'violencePhysicalHarm',
			title: l`Violence`,
			description: l`Violent or threatening content`,
			options: [
				{
					title: l`Animal welfare`,
					reason: OzoneReason.REASONVIOLENCEANIMAL,
				},
				{
					title: l`Threats or incitement`,
					reason: OzoneReason.REASONVIOLENCETHREATS,
				},
				{
					title: l`Graphic violent content`,
					reason: OzoneReason.REASONVIOLENCEGRAPHICCONTENT,
				},
				{
					title: l`Glorification of violence`,
					reason: OzoneReason.REASONVIOLENCEGLORIFICATION,
				},
				{
					title: l`Extremist content`,
					reason: OzoneReason.REASONVIOLENCEEXTREMISTCONTENT,
				},
				{
					title: l`Human trafficking`,
					reason: OzoneReason.REASONVIOLENCETRAFFICKING,
				},
				{
					title: l`Other violent content`,
					reason: OzoneReason.REASONVIOLENCEOTHER,
				},
			],
		},
		childSafety: {
			key: 'childSafety',
			title: l`Child safety`,
			description: l`Harming or endangering minors`,
			options: [
				{
					title: l`Child Sexual Abuse Material (CSAM)`,
					reason: OzoneReason.REASONCHILDSAFETYCSAM,
				},
				{
					title: l`Grooming or predatory behavior`,
					reason: OzoneReason.REASONCHILDSAFETYGROOM,
				},
				{
					title: l`Privacy violation of a minor`,
					reason: OzoneReason.REASONCHILDSAFETYPRIVACY,
				},
				{
					title: l`Minor harassment or bullying`,
					reason: OzoneReason.REASONCHILDSAFETYHARASSMENT,
				},
				{
					title: l`Other child safety issue`,
					reason: OzoneReason.REASONCHILDSAFETYOTHER,
				},
			],
		},
		selfHarm: {
			key: 'selfHarm',
			title: l`Self-harm or dangerous behaviors`,
			description: l`Harmful or high-risk activities`,
			options: [
				{
					title: l`Content promoting or depicting self-harm`,
					reason: OzoneReason.REASONSELFHARMCONTENT,
				},
				{
					title: l`Eating disorders`,
					reason: OzoneReason.REASONSELFHARMED,
				},
				{
					title: l`Dangerous challenges or activities`,
					reason: OzoneReason.REASONSELFHARMSTUNTS,
				},
				{
					title: l`Dangerous substances or drug abuse`,
					reason: OzoneReason.REASONSELFHARMSUBSTANCES,
				},
				{
					title: l`Other dangerous content`,
					reason: OzoneReason.REASONSELFHARMOTHER,
				},
			],
		},
		ruleBreaking: {
			key: 'ruleBreaking',
			title: l`Breaking site rules`,
			description: l`Banned activities or security violations`,
			options: [
				{
					title: l`Hacking or system attacks`,
					reason: OzoneReason.REASONRULESITESECURITY,
				},
				{
					title: l`Promoting or selling prohibited items or services`,
					reason: OzoneReason.REASONRULEPROHIBITEDSALES,
				},
				{
					title: l`Banned user returning`,
					reason: OzoneReason.REASONRULEBANEVASION,
				},
				{
					title: l`Other network rule-breaking`,
					reason: OzoneReason.REASONRULEOTHER,
				},
			],
		},
		other: {
			key: 'other',
			title: l`Other`,
			description: l`An issue not included in these options`,
			options: [
				{
					title: l`Other`,
					reason: OzoneReason.REASONOTHER,
				},
			],
		},
	};

	return {
		categories: Object.values(categories),
		getCategory(reasonName: ReportCategory) {
			return categories[reasonName];
		},
	};
}
