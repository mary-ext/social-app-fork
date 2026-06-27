import { useCallback, useMemo, useState } from 'react';
import type { ComAtprotoLabelDefs, ComAtprotoModerationCreateReport } from '@atcute/atproto';
import { ClientResponseError, ok } from '@atcute/client';
import type { AtprotoAudience } from '@atcute/lexicons/syntax';
import { useMutation } from '@tanstack/react-query';

import { useConstant } from '#/lib/hooks/use-constant';
import { useLabelSubject } from '#/lib/moderation';
import { OzoneReason } from '#/lib/moderation/report-reasons';
import { useLabelInfo } from '#/lib/moderation/useLabelInfo';
import { makeProfileLink } from '#/lib/routes/links';
import { sanitizeHandle } from '#/lib/strings/handles';

import { useClients, useSession } from '#/state/session';

import { logger } from '#/logger';

import { relativeMessageParts } from '#/locale/intl/timeAgo';
import { Trans } from '#/locale/Trans';

import { Loader } from '#/components/Loader';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import * as Toast from '#/components/Toast';
import { Admonition } from '#/components/web/Admonition';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import { InlineLinkText } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

import * as styles from './LabelsOnMeDialog.css';

export { useDialogHandle as useLabelsOnMeDialogControl } from '#/components/web/Dialog';

export interface LabelsOnMeDialogProps {
	control: Dialog.DialogHandle;
	labels: ComAtprotoLabelDefs.Label[];
	type: 'account' | 'content';
}

export function LabelsOnMeDialog(props: LabelsOnMeDialogProps) {
	const isAccount = props.type === 'account';
	return (
		<Dialog.Root handle={props.control}>
			<Dialog.Popup
				label={
					isAccount
						? m['components.moderation.label.appliedToAccount']()
						: m['components.moderation.label.appliedToContent']()
				}
			>
				<LabelsOnMeDialogInner {...props} />
				<Dialog.Close />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function LabelsOnMeDialogInner({ control, labels, type }: LabelsOnMeDialogProps) {
	const { currentAccount } = useSession();
	const [appealingLabel, setAppealingLabel] = useState<ComAtprotoLabelDefs.Label | undefined>(undefined);
	const isAccount = type === 'account';
	const containsSelfLabel = useMemo(
		() => labels.some((label) => label.src === currentAccount?.did),
		[currentAccount?.did, labels],
	);

	return (
		<div className={styles.main}>
			{appealingLabel ? (
				<AppealForm
					control={control}
					label={appealingLabel}
					onPressBack={() => setAppealingLabel(undefined)}
				/>
			) : (
				<>
					<Text className={styles.title} size="_2xl" weight="bold">
						{isAccount
							? m['components.moderation.label.titleAccount']()
							: m['components.moderation.label.titleContent']()}
					</Text>
					<Text size="md">
						{containsSelfLabel
							? m['components.moderation.appeal.nonSelfHint']()
							: m['components.moderation.appeal.theseLabelsHint']()}
					</Text>

					<div className={styles.list}>
						{labels.map((label) => (
							<Label
								key={`${label.val}-${label.src}`}
								control={control}
								isSelfLabel={label.src === currentAccount?.did}
								label={label}
								onPressAppeal={setAppealingLabel}
							/>
						))}
					</div>
				</>
			)}
		</div>
	);
}

function Label({
	control,
	isSelfLabel,
	label,
	onPressAppeal,
}: {
	control: Dialog.DialogHandle;
	isSelfLabel: boolean;
	label: ComAtprotoLabelDefs.Label;
	onPressAppeal: (label: ComAtprotoLabelDefs.Label) => void;
}) {
	const { labeler, strings } = useLabelInfo(label);
	const sourceName = labeler ? sanitizeHandle(labeler.creator.handle, '@') : label.src;
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
			<div className={styles.divider} />
			<div className={styles.band}>
				{isSelfLabel ? (
					<Text color="textContrastMedium">{m['components.moderation.label.appliedByYou']()}</Text>
				) : (
					<div className={styles.sourceRow}>
						<Text className={styles.sourceText} color="textContrastMedium" numberOfLines={1}>
							<Trans
								message={m['common.moderation.source']}
								inputs={{ sourceName }}
								markup={{
									t0: ({ children }) => (
										<InlineLinkText
											label={sourceName}
											onPress={() => control.close()}
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
	control,
	label,
	onPressBack,
}: {
	control: Dialog.DialogHandle;
	label: ComAtprotoLabelDefs.Label;
	onPressBack: () => void;
}) {
	const { labeler, strings } = useLabelInfo(label);
	const [details, setDetails] = useState('');
	const { subject } = useLabelSubject({ label });
	const isAccountReport = 'did' in subject;
	const { pds } = useClients();
	const sourceName = labeler ? sanitizeHandle(labeler.creator.handle, '@') : label.src;
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
			control.close();
			Toast.show(m['common.appeal.submittedToast']());
		},
	});

	const onSubmit = useCallback(() => mutate(), [mutate]);

	return (
		<>
			<div className={styles.appealHeader}>
				<Text className={styles.title} size="_2xl" weight="semiBold">
					{m['components.moderation.appeal.title']({ name: strings.name })}
				</Text>
				<Text size="md">
					<Trans
						message={m['components.moderation.appeal.sentTo']}
						inputs={{ sourceName }}
						markup={{
							t0: ({ children }) => (
								<InlineLinkText
									label={sourceName}
									onPress={() => control.close()}
									size="md"
									to={makeProfileLink(labeler ? labeler.creator : { did: label.src })}
								>
									{children}
								</InlineLinkText>
							),
						}}
					/>
				</Text>
			</div>
			{error && (
				<Admonition className={styles.appealError} type="error">
					{error}
				</Admonition>
			)}
			<div className={styles.appealInput}>
				<TextField.Input
					autoFocus
					label={m['common.a11y.textInput']()}
					maxLength={300}
					minRows={3}
					multiline
					onChangeText={setDetails}
					placeholder={m['components.moderation.appeal.explainPrompt']({
						labeler: labeler ? sanitizeHandle(labeler.creator.handle, '@') : label.src,
					})}
					value={details}
				/>
			</div>
			<div className={styles.appealActions}>
				<Button
					color="secondary"
					label={m['common.action.back']()}
					onClick={onPressBack}
					size="large"
					variant="solid"
				>
					<ButtonText>{m['common.action.back']()}</ButtonText>
				</Button>
				<Button
					color="primary"
					label={m['common.action.submit']()}
					onClick={onSubmit}
					size="large"
					variant="solid"
				>
					<ButtonText>{m['common.action.submit']()}</ButtonText>
					{isPending && <ButtonIcon icon={Loader} />}
				</Button>
			</div>
		</>
	);
}
