import { useState } from 'react';

import type { ComAtprotoLabelDefs, ComAtprotoModerationCreateReport } from '@atcute/atproto';
import { ClientResponseError, ok } from '@atcute/client';
import type { AtprotoAudience } from '@atcute/lexicons/syntax';

import { useMutation } from '@tanstack/react-query';

import { useConstant } from '#/lib/hooks/use-constant';
import { useLabelSubject } from '#/lib/moderation';
import { OzoneReason } from '#/lib/moderation/report-reasons';
import { useLabelInfo } from '#/lib/moderation/useLabelInfo';
import { makeProfileLink } from '#/lib/routes/links';

import { useClients, useSession } from '#/state/session';

import { logger } from '#/logger';

import { relativeMessageParts } from '#/locale/intl/timeAgo';
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

import * as styles from './LabelsOnMeDialog.css';

export interface LabelsOnMeDialogProps {
	handle: Dialog.DialogHandle;
	labels: ComAtprotoLabelDefs.Label[];
	type: 'account' | 'content';
}

export function LabelsOnMeDialog(props: LabelsOnMeDialogProps) {
	return (
		<Dialog.Root handle={props.handle}>
			<Dialog.Popup size="wide">
				<LabelsOnMeDialogInner {...props} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function LabelsOnMeDialogInner({ handle, labels, type }: LabelsOnMeDialogProps) {
	const { currentAccount } = useSession();
	const [appealingLabel, setAppealingLabel] = useState<ComAtprotoLabelDefs.Label | undefined>(undefined);
	const isAccount = type === 'account';
	const containsSelfLabel = labels.some((label) => label.src === currentAccount?.did);

	if (appealingLabel) {
		return (
			<AppealForm handle={handle} label={appealingLabel} onPressBack={() => setAppealingLabel(undefined)} />
		);
	}

	return (
		<Stack gap="lg">
			<Stack gap="xs">
				<Dialog.TitleRow>
					<Dialog.Title>
						{isAccount
							? m['components.moderation.label.titleAccount']()
							: m['components.moderation.label.titleContent']()}
					</Dialog.Title>
					<Dialog.Close />
				</Dialog.TitleRow>
				<Text color="textContrastMedium">
					{containsSelfLabel
						? m['components.moderation.appeal.nonSelfHint']()
						: m['components.moderation.appeal.theseLabelsHint']()}
				</Text>
			</Stack>

			<Stack gap="md">
				{labels.map((label) => (
					<Label
						key={`${label.val}-${label.src}`}
						handle={handle}
						isSelfLabel={label.src === currentAccount?.did}
						label={label}
						onPressAppeal={setAppealingLabel}
					/>
				))}
			</Stack>
		</Stack>
	);
}

function Label({
	handle,
	isSelfLabel,
	label,
	onPressAppeal,
}: {
	handle: Dialog.DialogHandle;
	isSelfLabel: boolean;
	label: ComAtprotoLabelDefs.Label;
	onPressAppeal: (label: ComAtprotoLabelDefs.Label) => void;
}) {
	const { labeler, strings } = useLabelInfo(label);
	const sourceName = labeler ? `@${labeler.creator.handle}` : label.src;
	const now = useConstant(Date.now);

	return (
		<div className={styles.card}>
			<div className={styles.cardTop}>
				<div className={styles.cardInfo}>
					<Text size="md" weight="semiBold">
						{strings.name}
					</Text>
					<Text color="textContrastMedium">{strings.description}</Text>
				</div>
				{!isSelfLabel && (
					<Button
						color="secondary"
						label={m['components.moderation.appeal.action']()}
						onClick={() => onPressAppeal(label)}
						size="small"
						variant="solid"
					>
						<ButtonText>{m['components.moderation.appeal.action']()}</ButtonText>
					</Button>
				)}
			</div>

			<Dialog.Divider />

			<div className={styles.band}>
				{isSelfLabel ? (
					<Text color="textContrastMedium">{m['components.moderation.label.appliedByYou']()}</Text>
				) : (
					<div className={styles.sourceRow}>
						<Text className={styles.sourceText} color="textContrastMedium" numberOfLines={1}>
							<Trans
								message={m['common.moderation.source']}
								inputs={{ source: sourceName }}
								markup={{
									t0: ({ children }) => (
										<InlineLinkText
											label={sourceName}
											onPress={() => handle.close()}
											to={makeProfileLink(labeler ? labeler.creator : { did: label.src })}
										>
											{children}
										</InlineLinkText>
									),
								}}
							/>
						</Text>
						{label.exp && (
							<Text className={styles.expires} color="textContrastMedium" size="sm">
								{m['common.mutedWord.expires'](relativeMessageParts(label.exp, now))}
							</Text>
						)}
					</div>
				)}
			</div>
		</div>
	);
}

function AppealForm({
	handle,
	label,
	onPressBack,
}: {
	handle: Dialog.DialogHandle;
	label: ComAtprotoLabelDefs.Label;
	onPressBack: () => void;
}) {
	const { labeler, strings } = useLabelInfo(label);
	const [details, setDetails] = useState('');
	const { subject } = useLabelSubject({ label });
	const isAccountReport = 'did' in subject;
	const { pds } = useClients();
	const sourceName = labeler ? `@${labeler.creator.handle}` : label.src;
	const [error, setError] = useState<string | null>(null);

	const { mutate, isPending } = useMutation({
		mutationFn: async () => {
			if (!pds) throw new Error('Not logged in');
			const $type = !isAccountReport ? 'com.atproto.repo.strongRef' : 'com.atproto.admin.defs#repoRef';
			// the appeal is funnelled to the labeler that applied the label
			const reportClient = pds.clone({ proxy: `${label.src}#atproto_labeler` as AtprotoAudience });
			await ok(
				reportClient.post('com.atproto.moderation.createReport', {
					input: {
						reasonType: OzoneReason.REASONAPPEAL,
						subject: {
							$type,
							...subject,
						},
						reason: details,
					} as ComAtprotoModerationCreateReport.$input,
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
