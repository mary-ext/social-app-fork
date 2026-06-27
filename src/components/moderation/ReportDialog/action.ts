import type { ComAtprotoModerationCreateReport } from '@atcute/atproto';
import type { AppBskyLabelerDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { Did, ResourceUri } from '@atcute/lexicons';
import type { AtprotoAudience } from '@atcute/lexicons/syntax';
import type { ToolsOzoneReportDefs } from '@atcute/ozone';
import { useMutation } from '@tanstack/react-query';

import { useClients } from '#/state/session';

import { logger } from '#/logger';

import { m } from '#/paraglide/messages';

import { NEW_TO_OLD_REASONS_MAP } from './const';
import type { ParsedReportSubject } from './types';

export function useSubmitReportMutation() {
	const { pds } = useClients();

	return useMutation({
		async mutationFn({
			details,
			labeler,
			reason,
			subject,
		}: {
			details?: string;
			labeler: AppBskyLabelerDefs.LabelerViewDetailed;
			reason: ToolsOzoneReportDefs.ReasonType;
			subject: ParsedReportSubject;
		}) {
			if (!pds) {
				throw new Error(m['components.moderation.error.mustSignInToReport']());
			}

			const labelerSupportedReasonTypes = labeler.reasonTypes || [];

			let reasonType = reason;
			const backwardsCompatibleReasonType = NEW_TO_OLD_REASONS_MAP[reasonType]!;
			const supportsNewReasonType = labelerSupportedReasonTypes.includes(reasonType);
			const supportsOldReasonType = labelerSupportedReasonTypes.includes(backwardsCompatibleReasonType);

			/*
			 * Only fall back for backwards compatibility if the labeler
			 * does not support the new reason type. If the labeler does not declare
			 * supported reason types, send the new version.
			 */
			if (supportsOldReasonType && !supportsNewReasonType) {
				reasonType = backwardsCompatibleReasonType;
			}

			let report: ComAtprotoModerationCreateReport.$input;

			switch (subject.type) {
				case 'account': {
					report = {
						reasonType,
						reason: details,
						subject: {
							$type: 'com.atproto.admin.defs#repoRef',
							did: subject.did as Did,
						},
					};
					break;
				}
				case 'status':
				case 'post':
				case 'list':
				case 'feed':
				case 'starterPack': {
					report = {
						reasonType,
						reason: details,
						subject: {
							$type: 'com.atproto.repo.strongRef',
							uri: subject.uri as ResourceUri,
							cid: subject.cid,
						},
					};
					break;
				}
				case 'convoMessage': {
					report = {
						reasonType,
						reason: details,
						// chat.bsky.convo.defs#messageRef is not in the createReport lexicon's
						// subject union, but the chat moderation service accepts it
						subject: {
							$type: 'chat.bsky.convo.defs#messageRef',
							messageId: subject.message.id,
							convoId: subject.convoId,
							did: subject.message.sender.did,
						} as unknown as ComAtprotoModerationCreateReport.$input['subject'],
					};
					break;
				}
				case 'convo': {
					report = {
						reasonType,
						reason: details,
						// chat.bsky.convo.defs#convoRef is not in the createReport lexicon's
						// subject union, but the chat moderation service accepts it
						subject: {
							$type: 'chat.bsky.convo.defs#convoRef',
							convoId: subject.convoId,
							did: subject.did,
						} as unknown as ComAtprotoModerationCreateReport.$input['subject'],
					};
					break;
				}
			}

			if (import.meta.env.DEV) {
				logger.info('Submitting report (dry run)', {
					labeler: {
						handle: labeler.creator.handle,
					},
					report,
				});
			} else {
				// the report is funnelled to the selected labeler via the atproto-proxy header
				const reportClient = pds.clone({
					proxy: `${labeler.creator.did}#atproto_labeler` as AtprotoAudience,
				});
				await ok(reportClient.post('com.atproto.moderation.createReport', { input: report }));
			}
		},
	});
}
