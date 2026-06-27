import { type ModerationCause, ModerationCauseType } from '@atcute/bluesky-moderation';
import { Trans } from '@lingui/react/macro';

import { useConstant } from '#/lib/hooks/use-constant';
import { useGetTimeAgo } from '#/lib/hooks/useTimeAgo';
import { useModerationCauseDescription } from '#/lib/moderation/useModerationCauseDescription';
import { makeProfileLink } from '#/lib/routes/links';
import { listUriToHref } from '#/lib/strings/url-helpers';

import { useSession } from '#/state/session';

import type { AppModerationCause } from '#/components/Pills';
import { Text } from '#/components/Text';
import { Admonition } from '#/components/web/Admonition';
import * as Dialog from '#/components/web/Dialog';
import { InlineLinkText } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

import * as styles from './ModerationDetailsDialog.css';

export { useDialogHandle as useModerationDetailsDialogControl } from '#/components/web/Dialog';

export interface ModerationDetailsDialogProps {
	control: Dialog.DialogHandle;
	modcause?: AppModerationCause | ModerationCause;
}

/**
 * Web-native moderation-details dialog. Open it declaratively with a `Dialog.Trigger` wired to the same
 * `control` handle (see `ContentHider`); the handle is also used to close the dialog when the source-profile
 * link navigates away.
 */
export function ModerationDetailsDialog({ control, modcause }: ModerationDetailsDialogProps) {
	return (
		<Dialog.Root handle={control}>
			<Dialog.Popup className={styles.popup} label={m['common.title.moderationDetails']()}>
				<ModerationDetailsDialogInner control={control} modcause={modcause} />
				<Dialog.Close />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function ModerationDetailsDialogInner({ control, modcause }: ModerationDetailsDialogProps) {
	const desc = useModerationCauseDescription(modcause);
	const { currentAccount } = useSession();
	const timeDiff = useGetTimeAgo({ future: true });
	const now = useConstant(Date.now);

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
					<InlineLinkText label={list.name} size="sm" to={listUriToHref(list.uri)}>
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
					<InlineLinkText label={list.name} size="sm" to={listUriToHref(list.uri)}>
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
		description = <Text size="md">{desc.description}</Text>;
	} else {
		// should never happen
		name = '';
		description = '';
	}

	const sourceName = desc.source || desc.sourceDisplayName || m['common.label.unknownLabeler']();

	return (
		<>
			<div className={styles.main}>
				<Text className={styles.title} size="_2xl" weight="bold">
					{name}
				</Text>
				<Text size="sm">{description}</Text>

				{desc.isSubjectAccount && (
					<Admonition className={styles.admonition} type="info">
						{m['common.hint.accountModeration']()}
					</Admonition>
				)}
			</div>
			{modcause?.type === ModerationCauseType.Label && (
				<div className={styles.labelBand}>
					{modcause.source === null ? (
						<Text size="md">{m['common.label.appliedByAuthor']()}</Text>
					) : (
						<div className={styles.sourceRow}>
							<Text className={styles.sourceText} color="textContrastMedium" numberOfLines={1}>
								<Trans>
									Source:{' '}
									<InlineLinkText
										label={sourceName}
										onPress={() => control.close()}
										to={makeProfileLink({ did: modcause.label.src })}
									>
										{sourceName}
									</InlineLinkText>
								</Trans>
							</Text>
							{modcause.label.exp && (
								<Text className={styles.expires} color="textContrastMedium" size="sm">
									{m['common.label.expiresIn']({ time: timeDiff(now, modcause.label.exp) })}
								</Text>
							)}
						</div>
					)}
				</div>
			)}
		</>
	);
}
