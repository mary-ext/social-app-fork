import { useState } from 'react';

import type { ComAtprotoLabelDefs } from '@atcute/atproto';
import { ClientResponseError } from '@atcute/client';

import { profileTarget } from '#/lib/routes/targets';

import { useLabelInfo } from '#/state/moderation/use-label-info';
import { useLabelAppealMutation } from '#/state/queries/moderation/appeal';

import { Trans } from '#/locale/Trans';

import * as Dialog from '#/components/Dialog';
import { Stack } from '#/components/Stack';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import * as Toast from '#/components/Toast';
import { Admonition } from '#/components/web/Admonition';
import { Button, ButtonSpinner, ButtonText } from '#/components/web/Button';
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
	const sourceName = labeler ? `@${labeler.creator.handle}` : label.src;
	const [error, setError] = useState<string | null>(null);

	const { mutate, isPending } = useLabelAppealMutation({
		label,
		onSuccess: () => {
			handle.close();
			Toast.show(m['common.appeal.submittedToast']());
		},
		onError: (err) => {
			if (err instanceof ClientResponseError && err.error === 'AlreadyAppealed') {
				setError(m['components.moderation.appeal.alreadyAppealed']());
			} else {
				console.error('Failed to submit label appeal', err);
				setError(m['common.appeal.submitError']());
			}
		},
	});

	const onSubmit = () => mutate({ reason: details });

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
									to={profileTarget(labeler ? labeler.creator.did : label.src)}
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
					{isPending && <ButtonSpinner color="white" label={m['common.status.saving']()} />}
				</Button>
			</Dialog.Actions>
		</Stack>
	);
}
