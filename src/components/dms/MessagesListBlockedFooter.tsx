import { useCallback, useMemo } from 'react';
import { View } from 'react-native';
import type { AnyProfileView } from '@atcute/bluesky';
import {
	type BlockingModerationCause,
	type ModerationDecision,
	ModerationCauseType,
} from '@atcute/bluesky-moderation';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useProfileBlockMutationQueue } from '#/state/queries/profile';

import { atoms as a, useTheme } from '#/alf';

import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import { useDialogControl } from '#/components/Dialog';
import { BlockedByListDialog } from '#/components/dms/BlockedByListDialog';
import { LeaveConvoPrompt } from '#/components/dms/LeaveConvoPrompt';
import { ArrowBoxLeft_Stroke2_Corner0_Rounded as LeaveIcon } from '#/components/icons/ArrowBoxLeft';
import {
	PersonCheck_Stroke2_Corner0_Rounded as PersonCheckIcon,
	PersonX_Stroke2_Corner0_Rounded as PersonXIcon,
} from '#/components/icons/Person';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './MessagesListBlockedFooter.css';

export function MessagesListBlockedFooter({
	recipient: initialRecipient,
	convoId,
	moderation,
	isGroup,
}: {
	recipient: AnyProfileView;
	convoId: string;
	moderation: ModerationDecision;
	isGroup: boolean;
}) {
	const t = useTheme();
	const recipient = useProfileShadow(initialRecipient);
	const [_queueBlock, queueUnblock] = useProfileBlockMutationQueue(recipient);

	const leaveConvoControl = useDialogControl();
	const blockedByListControl = useDialogControl();

	const { listBlocks, userBlock } = useMemo(() => {
		const blocks = moderation.causes.filter(
			(cause): cause is BlockingModerationCause => cause.type === ModerationCauseType.Blocking,
		);
		const listBlocks = blocks.filter((block) => block.source !== null);
		const userBlock = blocks.find((block) => block.source === null);
		return {
			listBlocks,
			userBlock,
		};
	}, [moderation]);

	const isBlocking = !!userBlock || !!listBlocks.length;

	const onUnblockPress = useCallback(() => {
		if (listBlocks.length) {
			blockedByListControl.open();
		} else {
			void queueUnblock();
		}
	}, [blockedByListControl, listBlocks, queueUnblock]);

	return (
		<View style={[a.p_md]}>
			<View
				style={[
					a.align_center,
					a.justify_center,
					a.p_lg,
					t.atoms.bg_contrast_50,
					{
						borderRadius: 40,
					},
				]}
			>
				<PersonXIcon fill={colors.text} size="xl" className={css.icon} />
				<Text style={[a.mb_xs, a.text_center, a.text_md, a.font_semi_bold, t.atoms.text]}>
					{isGroup
						? m['components.dms.block.youAreBlockingOwner']()
						: isBlocking
							? m['components.dms.block.youAreBlockingPerson']()
							: m['components.dms.block.personBlockingYou']()}
				</Text>
				<Text style={[a.text_center, a.text_sm, a.leading_snug, t.atoms.text_contrast_high]}>
					{m['components.dms.chat.readOnlyHint']()}
				</Text>
				{isBlocking ? (
					<Button
						label={m['common.block.action.unblock']()}
						color="secondary_inverted"
						size="large"
						style={[a.mt_lg, a.w_full]}
						onPress={onUnblockPress}
					>
						<ButtonIcon icon={PersonCheckIcon} />
						<ButtonText>{m['common.block.action.unblock']()}</ButtonText>
					</Button>
				) : null}
				<Button
					label={m['common.chat.action.leave']()}
					color="secondary_inverted"
					size="large"
					style={[a.mt_lg, a.w_full]}
					onPress={leaveConvoControl.open}
				>
					<ButtonIcon icon={LeaveIcon} />
					<ButtonText>{m['common.chat.action.leave']()}</ButtonText>
				</Button>
				<LeaveConvoPrompt control={leaveConvoControl} currentScreen="conversation" convoId={convoId} />
				<BlockedByListDialog control={blockedByListControl} listBlocks={listBlocks} />
			</View>
		</View>
	);
}
