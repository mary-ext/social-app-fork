import { View } from 'react-native';
import { type ModerationCause, ModerationCauseType } from '@atcute/bluesky-moderation';
import { Trans } from '@lingui/react/macro';

import { useGetTimeAgo } from '#/lib/hooks/useTimeAgo';
import { useModerationCauseDescription } from '#/lib/moderation/useModerationCauseDescription';
import { makeProfileLink } from '#/lib/routes/links';
import { listUriToHref } from '#/lib/strings/url-helpers';

import { useSession } from '#/state/session';
import { useTickEveryMinute } from '#/state/shell';

import { atoms as a, useGutters, useTheme } from '#/alf';

import { Admonition } from '#/components/Admonition';
import * as Dialog from '#/components/Dialog';
import { InlineLinkText } from '#/components/Link';
import type { AppModerationCause } from '#/components/Pills';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

export { useDialogControl as useModerationDetailsDialogControl } from '#/components/Dialog';

export interface ModerationDetailsDialogProps {
	control: Dialog.DialogOuterProps['control'];
	modcause?: ModerationCause | AppModerationCause;
}

export function ModerationDetailsDialog(props: ModerationDetailsDialogProps) {
	return (
		<Dialog.Outer control={props.control}>
			<Dialog.Handle />
			<ModerationDetailsDialogInner {...props} />
		</Dialog.Outer>
	);
}

function ModerationDetailsDialogInner({
	modcause,
	control,
}: ModerationDetailsDialogProps & {
	control: Dialog.DialogOuterProps['control'];
}) {
	const t = useTheme();
	const xGutters = useGutters([0, 'base']);
	const desc = useModerationCauseDescription(modcause);
	const { currentAccount } = useSession();
	const timeDiff = useGetTimeAgo({ future: true });
	// re-evaluate the expiry countdown each minute; the dialog is short-lived so this is cheap.
	const tick = useTickEveryMinute();

	let name;
	let description;
	if (!modcause) {
		name = m['common.label.contentWarning']();
		description = m['common.label.generalWarning']();
	} else if (modcause.type === 'reply-hidden') {
		const isYou = currentAccount?.did === modcause.source.did;
		name = isYou ? m['common.label.replyHiddenByYou']() : m['common.label.replyHiddenByAuthor']();
		description = isYou ? m['common.label.youHidReply']() : m['common.label.authorHiddenReply']();
	} else if (modcause.type === ModerationCauseType.Blocking) {
		if (modcause.source) {
			const list = modcause.source;
			name = m['common.title.userBlockedByList']();
			description = (
				<Trans>
					This user is included in the{' '}
					<InlineLinkText label={list.name} to={listUriToHref(list.uri)} style={[a.text_sm]}>
						{list.name}
					</InlineLinkText>{' '}
					list which you have blocked.
				</Trans>
			);
		} else {
			name = m['common.title.userBlocked']();
			description = m['common.label.youBlockedUser']();
		}
	} else if (modcause.type === ModerationCauseType.BlockedBy) {
		name = m['common.title.userBlocksYou']();
		description = m['common.label.blockedByUser']();
	} else if (modcause.type === ModerationCauseType.MutedPermanent) {
		if (modcause.source) {
			const list = modcause.source;
			name = m['common.label.accountMutedByList']();
			description = (
				<Trans>
					This user is included in the{' '}
					<InlineLinkText label={list.name} to={listUriToHref(list.uri)} style={[a.text_sm]}>
						{list.name}
					</InlineLinkText>{' '}
					list which you have muted.
				</Trans>
			);
		} else {
			name = m['common.label.accountMuted']();
			description = m['common.label.youMutedAccount']();
		}
	} else if (modcause.type === ModerationCauseType.MutedTemporary) {
		name = m['common.label.accountMuted']();
		description = m['common.label.youMutedAccount']();
	} else if (modcause.type === ModerationCauseType.MutedKeyword) {
		name = m['common.label.postHiddenByMutedWord']();
		description = m['common.label.hiddenWordTag']();
	} else if (modcause.type === ModerationCauseType.Hidden) {
		name = m['common.label.postHiddenByYou']();
		description = m['common.label.youHidPost']();
	} else if (modcause.type === ModerationCauseType.Label) {
		name = desc.name;
		description = (
			<Text emoji style={[t.atoms.text, a.text_md, a.leading_snug]}>
				{desc.description}
			</Text>
		);
	} else {
		// should never happen
		name = '';
		description = '';
	}

	const sourceName = desc.source || desc.sourceDisplayName || m['common.label.unknownLabeler']();

	return (
		<Dialog.ScrollableInner
			label={m['common.title.moderationDetails']()}
			contentContainerStyle={{
				paddingLeft: 0,
				paddingRight: 0,
				paddingBottom: 0,
			}}
			style={{
				maxWidth: 460,
			}}
		>
			<View style={[xGutters, a.pb_lg]}>
				<Text emoji style={[t.atoms.text, a.text_2xl, a.font_bold, a.mb_sm]}>
					{name}
				</Text>
				<Text style={[t.atoms.text, a.text_sm, a.leading_snug]}>{description}</Text>

				{desc.isSubjectAccount && (
					<Admonition type="info" style={[a.mt_md]}>
						{m['common.hint.accountModeration']()}
					</Admonition>
				)}
			</View>
			{modcause?.type === ModerationCauseType.Label && (
				<View
					style={[
						xGutters,
						a.py_md,
						a.border_t,
						t.atoms.bg_contrast_25,
						t.atoms.border_contrast_low,
						{
							borderBottomLeftRadius: a.rounded_md.borderRadius,
							borderBottomRightRadius: a.rounded_md.borderRadius,
						},
					]}
				>
					{modcause.source === null ? (
						<Text style={[t.atoms.text, a.text_md, a.leading_snug]}>
							{m['common.label.appliedByAuthor']()}
						</Text>
					) : (
						<>
							<View style={[a.flex_row, a.justify_between, a.gap_xl, { paddingBottom: 1 }]}>
								<Text style={[a.flex_1, a.leading_snug, t.atoms.text_contrast_medium]} numberOfLines={1}>
									<Trans>
										Source:{' '}
										<InlineLinkText
											label={sourceName}
											to={makeProfileLink({ did: modcause.label.src })}
											onPress={() => control.close()}
										>
											{sourceName}
										</InlineLinkText>
									</Trans>
								</Text>
								{modcause.label.exp && (
									<View>
										<Text style={[a.leading_snug, a.text_sm, a.italic, t.atoms.text_contrast_medium]}>
											{m['common.label.expiresIn']({ time: timeDiff(tick, modcause.label.exp) })}
										</Text>
									</View>
								)}
							</View>
						</>
					)}
				</View>
			)}
			<Dialog.Close />
		</Dialog.ScrollableInner>
	);
}
