import { useState } from 'react';
import { type ModerationCause, ModerationCauseType } from '@atcute/bluesky-moderation';
import { Trans, useLingui } from '@lingui/react/macro';

import { useGetTimeAgo } from '#/lib/hooks/useTimeAgo';
import { useModerationCauseDescription } from '#/lib/moderation/useModerationCauseDescription';
import { makeProfileLink } from '#/lib/routes/links';
import { listUriToHref } from '#/lib/strings/url-helpers';

import { useSession } from '#/state/session';

import type { AppModerationCause } from '#/components/Pills';
import { Admonition } from '#/components/web/Admonition';
import * as Dialog from '#/components/web/Dialog';
import { InlineLinkText } from '#/components/web/Link';
import { Text } from '#/components/web/Text';

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
	const { t: l } = useLingui();
	return (
		<Dialog.Root handle={control}>
			<Dialog.Popup className={styles.popup} label={l`Moderation details`}>
				<ModerationDetailsDialogInner control={control} modcause={modcause} />
				<Dialog.Close />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function ModerationDetailsDialogInner({ control, modcause }: ModerationDetailsDialogProps) {
	const { t: l } = useLingui();
	const desc = useModerationCauseDescription(modcause);
	const { currentAccount } = useSession();
	const timeDiff = useGetTimeAgo({ future: true });
	const [now] = useState(() => Date.now());

	let name;
	let description;
	if (!modcause) {
		name = l`Content Warning`;
		description = l`Moderator has chosen to set a general warning on the content.`;
	} else if (modcause.type === 'reply-hidden') {
		const isYou = currentAccount?.did === modcause.source.did;
		name = isYou ? l`Reply Hidden by You` : l`Reply Hidden by Thread Author`;
		description = isYou ? l`You hid this reply.` : l`The author of this thread has hidden this reply.`;
	} else if (modcause.type === ModerationCauseType.Blocking) {
		if (modcause.source) {
			const list = modcause.source;
			name = l`User Blocked by List`;
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
			name = l`User Blocked`;
			description = l`You have blocked this user. You cannot view their content.`;
		}
	} else if (modcause.type === ModerationCauseType.BlockedBy) {
		name = l`User Blocks You`;
		description = l`This user has blocked you. You cannot view their content.`;
	} else if (modcause.type === ModerationCauseType.MutedPermanent) {
		if (modcause.source) {
			const list = modcause.source;
			name = l`Account Muted by List`;
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
			name = l`Account Muted`;
			description = l`You have muted this account.`;
		}
	} else if (modcause.type === ModerationCauseType.MutedTemporary) {
		name = l`Account Muted`;
		description = l`You have muted this account.`;
	} else if (modcause.type === ModerationCauseType.MutedKeyword) {
		name = l`Post Hidden by Muted Word`;
		description = l`You've chosen to hide a word or tag within this post.`;
	} else if (modcause.type === ModerationCauseType.Hidden) {
		name = l`Post Hidden by You`;
		description = l`You have hidden this post.`;
	} else if (modcause.type === ModerationCauseType.Label) {
		name = desc.name;
		description = (
			<Text leading="snug" size="md">
				{desc.description}
			</Text>
		);
	} else {
		// should never happen
		name = '';
		description = '';
	}

	const sourceName = desc.source || desc.sourceDisplayName || l`an unknown labeler`;

	return (
		<>
			<div className={styles.main}>
				<Text className={styles.title} size="_2xl" weight="bold">
					{name}
				</Text>
				<Text leading="snug" size="sm">
					{description}
				</Text>

				{desc.isSubjectAccount && (
					<Admonition className={styles.admonition} type="info">
						<Trans>
							This moderation was applied to the entire user account and will appear on all posts.
						</Trans>
					</Admonition>
				)}
			</div>
			{modcause?.type === ModerationCauseType.Label && (
				<div className={styles.labelBand}>
					{modcause.source === null ? (
						<Text leading="snug" size="md">
							<Trans>This label was applied by the author.</Trans>
						</Text>
					) : (
						<div className={styles.sourceRow}>
							<Text className={styles.sourceText} color="textContrastMedium" leading="snug" numberOfLines={1}>
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
								<Text className={styles.expires} color="textContrastMedium" leading="snug" size="sm">
									<Trans>Expires in {timeDiff(now, modcause.label.exp)}</Trans>
								</Text>
							)}
						</div>
					)}
				</div>
			)}
		</>
	);
}
