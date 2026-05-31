import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import type { ComAtprotoLabelDefs, ComAtprotoModerationCreateReport } from '@atcute/atproto';
import { ClientResponseError, ok } from '@atcute/client';
import type { AtprotoAudience } from '@atcute/lexicons/syntax';
import { Trans, useLingui } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';

import { useGetTimeAgo } from '#/lib/hooks/useTimeAgo';
import { useLabelSubject } from '#/lib/moderation';
import { OzoneReason } from '#/lib/moderation/report-reasons';
import { useLabelInfo } from '#/lib/moderation/useLabelInfo';
import { makeProfileLink } from '#/lib/routes/links';
import { sanitizeHandle } from '#/lib/strings/handles';

import { useClients, useSession } from '#/state/session';

import { logger } from '#/logger';

import { atoms as a, useBreakpoints, useTheme } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { InlineLinkText } from '#/components/Link';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';

import { Admonition } from '../Admonition';
import { Divider } from '../Divider';
import { Loader } from '../Loader';

export { useDialogControl as useLabelsOnMeDialogControl } from '#/components/Dialog';

export interface LabelsOnMeDialogProps {
	control: Dialog.DialogOuterProps['control'];
	labels: ComAtprotoLabelDefs.Label[];
	type: 'account' | 'content';
}

export function LabelsOnMeDialog(props: LabelsOnMeDialogProps) {
	return (
		<Dialog.Outer control={props.control} nativeOptions={{ preventExpansion: true }}>
			<Dialog.Handle />
			<LabelsOnMeDialogInner {...props} />
		</Dialog.Outer>
	);
}

function LabelsOnMeDialogInner(props: LabelsOnMeDialogProps) {
	const { t: l } = useLingui();
	const { currentAccount } = useSession();
	const [appealingLabel, setAppealingLabel] = useState<ComAtprotoLabelDefs.Label | undefined>(undefined);
	const { labels } = props;
	const isAccount = props.type === 'account';
	const containsSelfLabel = useMemo(
		() => labels.some((l) => l.src === currentAccount?.did),
		[currentAccount?.did, labels],
	);

	return (
		<Dialog.ScrollableInner
			label={
				isAccount
					? l`The following labels were applied to your account.`
					: l`The following labels were applied to your content.`
			}
		>
			{appealingLabel ? (
				<AppealForm
					label={appealingLabel}
					control={props.control}
					onPressBack={() => setAppealingLabel(undefined)}
				/>
			) : (
				<>
					<Text style={[a.text_2xl, a.font_bold, a.pb_xs, a.leading_tight]}>
						{isAccount ? <Trans>Labels on your account</Trans> : <Trans>Labels on your content</Trans>}
					</Text>
					<Text style={[a.text_md, a.leading_snug]}>
						{containsSelfLabel ? (
							<Trans>You may appeal non-self labels if you feel they were placed in error.</Trans>
						) : (
							<Trans>You may appeal these labels if you feel they were placed in error.</Trans>
						)}
					</Text>

					<View style={[a.py_lg, a.gap_md]}>
						{labels.map((label) => (
							<Label
								key={`${label.val}-${label.src}`}
								label={label}
								isSelfLabel={label.src === currentAccount?.did}
								control={props.control}
								onPressAppeal={setAppealingLabel}
							/>
						))}
					</View>
				</>
			)}
			<Dialog.Close />
		</Dialog.ScrollableInner>
	);
}

function Label({
	label,
	isSelfLabel,
	control,
	onPressAppeal,
}: {
	label: ComAtprotoLabelDefs.Label;
	isSelfLabel: boolean;
	control: Dialog.DialogOuterProps['control'];
	onPressAppeal: (label: ComAtprotoLabelDefs.Label) => void;
}) {
	const t = useTheme();
	const { t: l } = useLingui();
	const { labeler, strings } = useLabelInfo(label);
	const sourceName = labeler ? sanitizeHandle(labeler.creator.handle, '@') : label.src;
	const timeDiff = useGetTimeAgo({ future: true });
	return (
		<View style={[a.border, t.atoms.border_contrast_low, a.rounded_sm, a.overflow_hidden]}>
			<View style={[a.p_md, a.gap_sm, a.flex_row]}>
				<View style={[a.flex_1, a.gap_xs]}>
					<Text emoji style={[a.font_semi_bold, a.text_md]}>
						{strings.name}
					</Text>
					<Text emoji style={[t.atoms.text_contrast_medium, a.leading_snug]}>
						{strings.description}
					</Text>
				</View>
				{!isSelfLabel && (
					<View>
						<Button
							variant="solid"
							color="secondary"
							size="small"
							label={l`Appeal`}
							onPress={() => onPressAppeal(label)}
						>
							<ButtonText>
								<Trans>Appeal</Trans>
							</ButtonText>
						</Button>
					</View>
				)}
			</View>
			<Divider />
			<View style={[a.px_md, a.py_sm, t.atoms.bg_contrast_25]}>
				{isSelfLabel ? (
					<Text style={[t.atoms.text_contrast_medium]}>
						<Trans>This label was applied by you.</Trans>
					</Text>
				) : (
					<View style={[a.flex_row, a.justify_between, a.gap_xl, { paddingBottom: 1 }]}>
						<Text style={[a.flex_1, a.leading_snug, t.atoms.text_contrast_medium]} numberOfLines={1}>
							<Trans>
								Source:{' '}
								<InlineLinkText
									label={sourceName}
									to={makeProfileLink(labeler ? labeler.creator : { did: label.src })}
									onPress={() => control.close()}
								>
									{sourceName}
								</InlineLinkText>
							</Trans>
						</Text>
						{label.exp && (
							<View>
								<Text style={[a.leading_snug, a.text_sm, a.italic, t.atoms.text_contrast_medium]}>
									<Trans>Expires in {timeDiff(Date.now(), label.exp)}</Trans>
								</Text>
							</View>
						)}
					</View>
				)}
			</View>
		</View>
	);
}

function AppealForm({
	label,
	control,
	onPressBack,
}: {
	label: ComAtprotoLabelDefs.Label;
	control: Dialog.DialogOuterProps['control'];
	onPressBack: () => void;
}) {
	const { t: l } = useLingui();
	const { labeler, strings } = useLabelInfo(label);
	const { gtMobile } = useBreakpoints();
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
				setError(l`You've already appealed this label and it's being reviewed by our moderation team.`);
			} else {
				setError(l`Failed to submit appeal, please try again.`);
			}
			logger.error('Failed to submit label appeal', { message: err });
		},
		onSuccess: () => {
			control.close();
			Toast.show(l({ message: 'Appeal submitted', context: 'toast' }));
		},
	});

	const onSubmit = useCallback(() => mutate(), [mutate]);

	return (
		<>
			<View>
				<Text style={[a.text_2xl, a.font_semi_bold, a.pb_xs, a.leading_tight]}>
					<Trans>Appeal "{strings.name}" label</Trans>
				</Text>
				<Text style={[a.text_md, a.leading_snug]}>
					<Trans>
						This appeal will be sent to{' '}
						<InlineLinkText
							label={sourceName}
							to={makeProfileLink(labeler ? labeler.creator : { did: label.src })}
							onPress={() => control.close()}
							style={[a.text_md, a.leading_snug]}
						>
							{sourceName}
						</InlineLinkText>
						.
					</Trans>
				</Text>
			</View>
			{error && (
				<Admonition type="error" style={[a.mt_sm]}>
					{error}
				</Admonition>
			)}
			<View style={[a.my_md]}>
				<Dialog.Input
					label={l`Text input field`}
					placeholder={l`Please explain why you think this label was incorrectly applied by ${
						labeler ? sanitizeHandle(labeler.creator.handle, '@') : label.src
					}`}
					value={details}
					onChangeText={setDetails}
					autoFocus={true}
					numberOfLines={3}
					multiline
					maxLength={300}
				/>
			</View>
			<View
				style={gtMobile ? [a.flex_row, a.justify_between] : [{ flexDirection: 'column-reverse' }, a.gap_sm]}
			>
				<Button
					testID="backBtn"
					variant="solid"
					color="secondary"
					size="large"
					onPress={onPressBack}
					label={l`Back`}
				>
					<ButtonText>{l`Back`}</ButtonText>
				</Button>
				<Button
					testID="submitBtn"
					variant="solid"
					color="primary"
					size="large"
					onPress={onSubmit}
					label={l`Submit`}
				>
					<ButtonText>{l`Submit`}</ButtonText>
					{isPending && <ButtonIcon icon={Loader} />}
				</Button>
			</View>
			{false}
		</>
	);
}
