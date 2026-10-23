import type { ComAtprotoLabelDefs } from '@atcute/atproto';
import type { AppBskyActorDefs } from '@atcute/bluesky';
import { ok } from '@atcute/client';
import type { AtprotoAudience } from '@atcute/lexicons/syntax';
import type { ToolsOzoneInboxAppealActionedSubject } from '@atcute/ozone';

import { useMutation } from '@tanstack/react-query';

import { getClients, useSession } from '#/state/session';

import { BSKY_LABELER_PROXY_AUDIENCE } from '#/env';

type AppealCallbacks = {
	onSuccess: () => void;
	onError: (err: Error) => void;
};

/**
 * appeals a label with the labeler that applied it.
 *
 * @param label the label to appeal
 * @param onSuccess called once the appeal is submitted
 * @param onError called when the appeal fails
 * @returns the mutation, taking the appeal's reason
 */
export function useLabelAppealMutation({
	label,
	onSuccess,
	onError,
}: AppealCallbacks & { label: ComAtprotoLabelDefs.Label }) {
	const { pds } = getClients();

	return useMutation<void, Error, { reason: string }>({
		mutationFn: async ({ reason }) => {
			if (!pds) {
				throw new Error('Not logged in');
			}
			// a label on a record carries a cid and appeals as a strong ref; one on an account has none and
			// appeals as a repo ref.
			const subject = label.cid ? { uri: label.uri, cid: label.cid } : { did: label.uri };
			// the appeal is funnelled to the labeler that applied the label
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `AtprotoAudience` pins the DID method; the lexicon doesn't
			const reportClient = pds.clone({ proxy: `${label.src}#atproto_labeler` as AtprotoAudience });
			const subjectRef =
				'did' in subject
					? { $type: 'com.atproto.admin.defs#repoRef', ...subject }
					: { $type: 'com.atproto.repo.strongRef', ...subject };
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- already split into a repo ref or a strong ref above
			const ref = subjectRef as ToolsOzoneInboxAppealActionedSubject.$input['subject'];
			await ok(
				reportClient.post('tools.ozone.inbox.appealActionedSubject', {
					input: {
						action: { $type: 'tools.ozone.inbox.appealActionedSubject#labelRef', val: label.val },
						subject: ref,
						reason,
					},
				}),
			);
		},
		onSuccess,
		onError,
	});
}

/**
 * appeals a live status takedown with the Bluesky moderation service.
 *
 * @param status the taken down status
 * @param onSuccess called once the appeal is submitted
 * @param onError called when the appeal fails
 * @returns the mutation, taking the appeal's reason
 */
export function useLiveStatusAppealMutation({
	status,
	onSuccess,
	onError,
}: AppealCallbacks & { status: AppBskyActorDefs.StatusView }) {
	const { pds } = getClients();

	return useMutation<void, Error, { reason: string }>({
		mutationFn: async ({ reason }) => {
			if (!pds) {
				throw new Error('Not logged in');
			}
			if (!status.uri || !status.cid) {
				throw new Error('Status is missing uri or cid');
			}

			// dev builds stop short of the write: appeals reach real moderators
			if (!import.meta.env.DEV) {
				await ok(
					pds.clone({ proxy: BSKY_LABELER_PROXY_AUDIENCE }).post('tools.ozone.inbox.appealActionedSubject', {
						input: {
							subject: {
								$type: 'com.atproto.repo.strongRef',
								uri: status.uri,
								cid: status.cid,
							},
							reason,
						},
					}),
				);
			}
		},
		onSuccess,
		onError,
	});
}

/**
 * appeals the current account's chat being disabled with the Bluesky moderation service.
 *
 * @param onSuccess called once the appeal is submitted
 * @param onError called when the appeal fails
 * @returns the mutation, taking the appeal's reason
 */
export function useChatAppealMutation({ onSuccess, onError }: AppealCallbacks) {
	const { pds } = getClients();
	const { currentAccount } = useSession();

	return useMutation<void, Error, { reason: string }>({
		mutationFn: async ({ reason }) => {
			if (!currentAccount) {
				throw new Error('No current account, should be unreachable');
			}
			if (!pds) {
				throw new Error('Not logged in');
			}
			await ok(
				pds.clone({ proxy: BSKY_LABELER_PROXY_AUDIENCE }).post('tools.ozone.inbox.appealActionedSubject', {
					input: {
						subject: {
							$type: 'com.atproto.admin.defs#repoRef',
							did: currentAccount.did,
						},
						reason,
					},
				}),
			);
		},
		onSuccess,
		onError,
	});
}
