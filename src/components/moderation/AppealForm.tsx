import { useState } from 'react';

import type { ComAtprotoLabelDefs, ComAtprotoModerationCreateReport } from '@atcute/atproto';
import { ClientResponseError, ok } from '@atcute/client';
import type { AtprotoAudience } from '@atcute/lexicons/syntax';

import { useMutation } from '@tanstack/react-query';

import { useLabelSubject } from '#/lib/moderation';
import { OzoneReason } from '#/lib/moderation/report-reasons';
import { useLabelInfo } from '#/lib/moderation/useLabelInfo';
import { makeProfileLink } from '#/lib/routes/links';

import { getClients } from '#/state/session';

import { logger } from '#/logger';

import { Trans } from '#/locale/Trans';

import * as Dialog from '#/components/Dialog';
import { Spinner } from '#/components/Spinner';
import { Stack } from '#/components/Stack';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import * as Toast from '#/components/Toast';
import { Admonition } from '#/components/web/Admonition';
import { Button, ButtonText } from '#/components/web/Button';
import { InlineLinkText } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

import * as styles from './AppealForm.css';

export interface AppealFormProps {
	handle: Dialog.DialogHandle;
	label: ComAtprotoLabelDefs.Label;
	onPressBack: () => void;
}

/** Submits a moderation appeal for a single label, closing {@link handle} on success. */
export function AppealForm({ handle, label, onPressBack }: AppealFormProps) {
	const { labeler, strings } = useLabelInfo(label);
	const [details, setDetails] = useState('');
	const { subject } = useLabelSubject({ label });
	const { pds } = getClients();
	const sourceName = labeler ? `@${labeler.creator.handle}` : label.src;
	const [error, setError] = useState<string | null>(null);

	const { mutate, isPending } = useMutation({
		mutationFn: async () => {
			if (!pds) {
				throw new Error('Not logged in');
			}
			// the appeal is funnelled to the labeler that applied the label
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `AtprotoAudience` pins the DID method; the lexicon doesn't
			const reportClient = pds.clone({ proxy: `${label.src}#atproto_labeler` as AtprotoAudience });
			// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- `useLabelSubject` already split this into a repo ref or a strong ref
			const ref = (
				'did' in subject
					? { $type: 'com.atproto.admin.defs#repoRef', ...subject }
					: { $type: 'com.atproto.repo.strongRef', ...subject }
			) as ComAtprotoModerationCreateReport.$input['subject'];
			await ok(
				reportClient.post('com.atproto.moderation.createReport', {
					input: {
						reasonType: OzoneReason.REASONAPPEAL,
						subject: ref,
						reason: details,
					},
				}),
			);
		},
		onError: (err) => {
			if (err instanceof ClientResponseError && err.error === 'AlreadyAppealed') {
				setError(m['components.moderation.appeal.alreadyAppealed']());
			} else {
				setError(m['common.appeal.submitError']());
			}
			logger.error('Failed to submit label appeal', { message: err });
		},
		onSuccess: () => {
			handle.close();
			Toast.show(m['common.appeal.submittedToast']());
		},
	});

	const onSubmit = () => mutate();

	return (
		<Stack gap="xl">
			<Stack gap="xs">
				<Dialog.TitleRow>
					<Dialog.Title>{m['components.moderation.appeal.title']({ name: strings.name })}</Dialog.Title>
					<Dialog.Close />
				</Dialog.TitleRow>

				<Text>
					<Trans
						message={m['components.moderation.appeal.sentTo']}
						inputs={{ sourceName }}
						markup={{
							t0: ({ children }) => (
								<InlineLinkText
									label={sourceName}
									onPress={() => handle.close()}
									size="md"
									to={makeProfileLink(labeler ? labeler.creator : { did: label.src })}
								>
									{children}
								</InlineLinkText>
							),
						}}
					/>
				</Text>
			</Stack>

			{error && (
				<Admonition className={styles.appealError} type="error">
					{error}
				</Admonition>
			)}

			<TextField.Input
				autoFocus
				label={m['common.a11y.textInput']()}
				maxLength={300}
				minRows={3}
				multiline
				onChangeText={setDetails}
				placeholder={m['components.moderation.appeal.explainPrompt']({
					labeler: labeler ? `@${labeler.creator.handle}` : label.src,
				})}
				value={details}
			/>

			<Dialog.Actions align="between" direction="responsive" reverse>
				<Button color="secondary" label={m['common.action.back']()} onClick={onPressBack} variant="solid">
					<ButtonText>{m['common.action.back']()}</ButtonText>
				</Button>

				<Button color="primary" label={m['common.action.submit']()} onClick={onSubmit} variant="solid">
					<ButtonText>{m['common.action.submit']()}</ButtonText>
					{isPending && <Spinner color="white" label={m['common.status.saving']()} size="sm" />}
				</Button>
			</Dialog.Actions>
		</Stack>
	);
}
