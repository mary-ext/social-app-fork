import { useCallback, useState } from 'react';
import { type StyleProp, View, type ViewStyle } from 'react-native';
import { ok } from '@atcute/client';
import type { Did } from '@atcute/lexicons';
import { useMutation } from '@tanstack/react-query';

import { OzoneReason } from '#/lib/moderation/report-reasons';

import { useClients, useSession } from '#/state/session';

import { logger } from '#/logger';

import { atoms as a, useBreakpoints, useTheme } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { Warning_Stroke2_Corner0_Rounded as WarningIcon } from '#/components/icons/Warning';
import { Loader } from '#/components/Loader';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';

import { BSKY_LABELER_PROXY_AUDIENCE } from '#/env';
import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './ChatDisabled.css';

export function ChatDisabled({
	shape = 'pill',
	style,
}: {
	shape?: 'pill' | 'banner';
	style?: StyleProp<ViewStyle>;
}) {
	const t = useTheme();
	return (
		<View style={[shape === 'pill' && a.p_md, style]}>
			<View
				style={[
					a.align_center,
					a.justify_center,
					a.p_lg,
					t.atoms.bg_contrast_50,
					shape === 'pill' && {
						borderRadius: 40,
					},
				]}
			>
				<WarningIcon fill={colors.text} size="lg" className={css.warningIcon} />
				<Text style={[a.mb_xs, a.text_center, a.text_md, a.font_semi_bold, t.atoms.text]}>
					{m['screens.messages.error.chatsDisabledTitle']()}
				</Text>
				<Text style={[a.text_center, a.text_sm, a.leading_snug, t.atoms.text_contrast_high]}>
					{m['screens.messages.error.chatsDisabledMod']()}
				</Text>
				<AppealDialog />
			</View>
		</View>
	);
}

function AppealDialog() {
	const control = Dialog.useDialogControl();
	return (
		<>
			<Button
				testID="appealDisabledChatBtn"
				color="secondary_inverted"
				size="large"
				onPress={control.open}
				label={m['screens.messages.action.appeal']()}
				style={[a.mt_lg, a.w_full]}
			>
				<ButtonText>{m['screens.messages.action.appeal']()}</ButtonText>
			</Button>
			<Dialog.Outer control={control}>
				<Dialog.Handle />
				<DialogInner />
			</Dialog.Outer>
		</>
	);
}

function DialogInner() {
	const control = Dialog.useDialogContext();
	const [details, setDetails] = useState('');
	const { gtMobile } = useBreakpoints();
	const { pds } = useClients();
	const { currentAccount } = useSession();

	const { mutate, isPending } = useMutation({
		mutationFn: async () => {
			if (!currentAccount) throw new Error('No current account, should be unreachable');
			if (!pds) throw new Error('Not logged in');
			// appeals to the default Bluesky labeler funnel through the atproto-proxy header
			await ok(
				pds.clone({ proxy: BSKY_LABELER_PROXY_AUDIENCE }).post('com.atproto.moderation.createReport', {
					input: {
						reasonType: OzoneReason.REASONAPPEAL,
						subject: {
							$type: 'com.atproto.admin.defs#repoRef',
							did: currentAccount.did as Did,
						},
						reason: details,
					},
				}),
			);
		},
		onError: (err) => {
			logger.error('Failed to submit chat appeal', { message: err });
			Toast.show(m['common.error.submitAppeal'](), {
				type: 'error',
			});
		},
		onSuccess: () => {
			control.close();
			Toast.show(m['common.toast.appealSubmitted']());
		},
	});

	const onSubmit = useCallback(() => mutate(), [mutate]);
	const onBack = useCallback(() => control.close(), [control]);

	return (
		<Dialog.ScrollableInner label={m['screens.messages.action.appeal']()}>
			<Text style={[a.text_2xl, a.font_semi_bold, a.pb_xs, a.leading_tight]}>
				{m['screens.messages.action.appeal']()}
			</Text>
			<Text style={[a.text_md, a.leading_snug]}>{m['common.hint.appealDestination']()}</Text>
			<View style={[a.my_md]}>
				<Dialog.Input
					label={m['common.a11y.textInput']()}
					placeholder={m['screens.messages.label.appealPrompt']()}
					value={details}
					onChangeText={setDetails}
					autoFocus={true}
					numberOfLines={3}
					multiline
					maxLength={300}
				/>
			</View>
			<View style={gtMobile ? [a.flex_row, a.justify_between] : [a.flex_col_reverse, a.gap_sm]}>
				<Button
					testID="backBtn"
					variant="solid"
					color="secondary"
					size="large"
					onPress={onBack}
					label={m['common.action.back']()}
				>
					<ButtonText>{m['common.action.back']()}</ButtonText>
				</Button>
				<Button
					testID="submitBtn"
					variant="solid"
					color="primary"
					size="large"
					onPress={onSubmit}
					label={m['common.action.submit']()}
				>
					<ButtonText>{m['common.action.submit']()}</ButtonText>
					{isPending && <ButtonIcon icon={Loader} />}
				</Button>
			</View>
			<Dialog.Close />
		</Dialog.ScrollableInner>
	);
}
