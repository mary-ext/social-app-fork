import { type ModerationCause, ModerationCauseType } from '@atcute/bluesky-moderation';

import { useConstant } from '#/lib/hooks/use-constant';
import { useModerationCauseDescription } from '#/lib/moderation/useModerationCauseDescription';
import { makeProfileLink } from '#/lib/routes/links';
import { listUriToHref } from '#/lib/strings/url-helpers';

import { useSession } from '#/state/session';

import { relativeMessageParts } from '#/locale/intl/timeAgo';
import { Trans } from '#/locale/Trans';

import type { AppModerationCause } from '#/components/Pills';
import { Text } from '#/components/Text';
import { Admonition } from '#/components/web/Admonition';
import * as Dialog from '#/components/web/Dialog';
import { InlineLinkText } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

import * as styles from './ModerationDetailsDialog.css';

export interface ModerationDetailsDialogProps {
	handle: Dialog.DialogHandle;
	modcause?: AppModerationCause | ModerationCause;
}

/** shows the details behind a moderation cause. */
export function ModerationDetailsDialog({ handle, modcause }: ModerationDetailsDialogProps) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup padding="none" size="medium">
				<ModerationDetailsDialogInner handle={handle} modcause={modcause} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function ModerationDetailsDialogInner({ handle, modcause }: ModerationDetailsDialogProps) {
	const desc = useModerationCauseDescription(modcause);
	const { currentAccount } = useSession();
	const now = useConstant(Date.now);

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
					inputs={{ name: list.name }}
					markup={{
						t0: ({ children }) => (
							<InlineLinkText label={list.name} size="sm" to={listUriToHref(list.uri)}>
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
					inputs={{ name: list.name }}
					markup={{
						t0: ({ children }) => (
							<InlineLinkText label={list.name} size="sm" to={listUriToHref(list.uri)}>
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
		description = <Text size="md">{desc.description}</Text>;
	} else {
		// should never happen
		name = '';
		description = '';
	}

	const sourceName = desc.source || desc.sourceDisplayName || m['common.moderation.unknownLabeler']();

	return (
		<>
			<div className={styles.main}>
				<Dialog.Stack gap="xs">
					<Dialog.TitleRow>
						<Dialog.Title>{name}</Dialog.Title>
						<Dialog.Close />
					</Dialog.TitleRow>
					<Text>{description}</Text>
				</Dialog.Stack>

				{desc.isSubjectAccount && (
					<Admonition className={styles.admonition} type="info">
						{m['common.moderation.accountHint']()}
					</Admonition>
				)}
			</div>

			{modcause?.type === ModerationCauseType.Label && (
				<div className={styles.labelBand}>
					{modcause.source === null ? (
						<Text size="md">{m['common.moderation.appliedByAuthor']()}</Text>
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
												to={makeProfileLink({ did: modcause.label.src })}
											>
												{children}
											</InlineLinkText>
										),
									}}
								/>
							</Text>
							{modcause.label.exp && (
								<Text className={styles.expires} color="textContrastMedium" size="sm">
									{m['common.mutedWord.expires'](relativeMessageParts(modcause.label.exp, now))}
								</Text>
							)}
						</div>
					)}
				</div>
			)}
		</>
	);
}
