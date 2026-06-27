import { View } from 'react-native';
import { type ModerationCause, ModerationCauseType } from '@atcute/bluesky-moderation';

import { useModerationCauseDescription } from '#/lib/moderation/useModerationCauseDescription';
import { makeProfileLink } from '#/lib/routes/links';
import { listUriToHref } from '#/lib/strings/url-helpers';

import { useSession } from '#/state/session';
import { useTickEveryMinute } from '#/state/shell';

import { relativeMessageParts } from '#/locale/intl/timeAgo';
import { Trans } from '#/locale/Trans';

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
	// re-evaluate the expiry countdown each minute; the dialog is short-lived so this is cheap.
	const tick = useTickEveryMinute();

	let name;
	let description;
	if (!modcause) {
		name = m['common.moderation.contentWarning']();
		description = m['common.moderation.generalWarning']();
	} else if (modcause.type === 'reply-hidden') {
		const isYou = currentAccount?.did === modcause.source.did;
		name = isYou ? m['common.thread.replyHiddenByYou']() : m['common.thread.replyHiddenByAuthor']();
		description = isYou ? m['common.thread.youHidReply']() : m['common.thread.authorHiddenReply']();
	} else if (modcause.type === ModerationCauseType.Blocking) {
		if (modcause.source) {
			const list = modcause.source;
			name = m['common.block.byList.title']();
			description = (
				<Trans
					message={m['common.block.byList.message']}
					inputs={{ listName: list.name }}
					markup={{
						t0: ({ children }) => (
							<InlineLinkText label={list.name} to={listUriToHref(list.uri)} style={[a.text_sm]}>
								{children}
							</InlineLinkText>
						),
					}}
				/>
			);
		} else {
			name = m['common.block.byYou.title']();
			description = m['common.block.byYou.message']();
		}
	} else if (modcause.type === ModerationCauseType.BlockedBy) {
		name = m['common.block.blocksYou.title']();
		description = m['common.block.blocksYou.message']();
	} else if (modcause.type === ModerationCauseType.MutedPermanent) {
		if (modcause.source) {
			const list = modcause.source;
			name = m['common.mute.byList.title']();
			description = (
				<Trans
					message={m['common.mute.byList.message']}
					inputs={{ listName: list.name }}
					markup={{
						t0: ({ children }) => (
							<InlineLinkText label={list.name} to={listUriToHref(list.uri)} style={[a.text_sm]}>
								{children}
							</InlineLinkText>
						),
					}}
				/>
			);
		} else {
			name = m['common.mute.byYou.title']();
			description = m['common.mute.byYou.message']();
		}
	} else if (modcause.type === ModerationCauseType.MutedTemporary) {
		name = m['common.mute.byYou.title']();
		description = m['common.mute.byYou.message']();
	} else if (modcause.type === ModerationCauseType.MutedKeyword) {
		name = m['common.mutedWord.postHidden']();
		description = m['common.mutedWord.hiddenTag']();
	} else if (modcause.type === ModerationCauseType.Hidden) {
		name = m['common.thread.postHiddenByYou']();
		description = m['common.thread.youHidPost']();
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

	const sourceName = desc.source || desc.sourceDisplayName || m['common.moderation.unknownLabeler']();

	return (
		<Dialog.ScrollableInner
			label={m['common.moderation.detailsTitle']()}
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
						{m['common.moderation.accountHint']()}
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
							{m['common.moderation.appliedByAuthor']()}
						</Text>
					) : (
						<>
							<View style={[a.flex_row, a.justify_between, a.gap_xl, { paddingBottom: 1 }]}>
								<Text style={[a.flex_1, a.leading_snug, t.atoms.text_contrast_medium]} numberOfLines={1}>
									<Trans
										message={m['common.moderation.source']}
										inputs={{ sourceName }}
										markup={{
											t0: ({ children }) => (
												<InlineLinkText
													label={sourceName}
													to={makeProfileLink({ did: modcause.label.src })}
													onPress={() => control.close()}
												>
													{children}
												</InlineLinkText>
											),
										}}
									/>
								</Text>
								{modcause.label.exp && (
									<View>
										<Text style={[a.leading_snug, a.text_sm, a.italic, t.atoms.text_contrast_medium]}>
											{m['common.mutedWord.expires'](relativeMessageParts(modcause.label.exp, tick))}
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
