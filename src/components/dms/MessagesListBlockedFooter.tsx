import type { AnyProfileView } from '@atcute/bluesky';
import {
	type BlockingModerationCause,
	type ModerationDecision,
	ModerationCauseType,
} from '@atcute/bluesky-moderation';

import { useProfileShadow } from '#/state/cache/profile-shadow';
import { useProfileBlockMutationQueue } from '#/state/queries/profile';

import { BlockedByListDialog } from '#/components/dms/BlockedByListDialog';
import { LeaveConvoPrompt } from '#/components/dms/LeaveConvoPrompt';
import { ArrowBoxLeft_Stroke2_Corner0_Rounded as LeaveIcon } from '#/components/icons/ArrowBoxLeft';
import {
	PersonCheck_Stroke2_Corner0_Rounded as PersonCheckIcon,
	PersonX_Stroke2_Corner0_Rounded as PersonXIcon,
} from '#/components/icons/Person';
import * as Prompt from '#/components/Prompt';
import { Text } from '#/components/Text';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

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
	const recipient = useProfileShadow(initialRecipient);
	const [_queueBlock, queueUnblock] = useProfileBlockMutationQueue(recipient);

	const leaveConvoPromptHandle = Prompt.usePromptHandle();
	const blockedByListPromptHandle = Prompt.usePromptHandle();

	const blocks = moderation.causes.filter(
		(cause): cause is BlockingModerationCause => cause.type === ModerationCauseType.Blocking,
	);
	const listBlocks = blocks.filter((block) => block.source !== null);
	const userBlock = blocks.find((block) => block.source === null);

	const isBlocking = !!userBlock || !!listBlocks.length;

	const onUnblockPress = () => {
		if (listBlocks.length) {
			blockedByListPromptHandle.open(null);
		} else {
			void queueUnblock();
		}
	};

	return (
		<div className={css.outer}>
			<div className={css.card}>
				<PersonXIcon className={css.icon} fill={colors.text} size="xl" />
				<Text align="center" className={css.heading} color="text" size="md" weight="semiBold">
					{isGroup
						? m['components.dms.block.youAreBlockingOwner']()
						: isBlocking
							? m['components.dms.block.youAreBlockingPerson']()
							: m['components.dms.block.personBlockingYou']()}
				</Text>
				<Text align="center" color="textContrastHigh" size="sm">
					{m['components.dms.chat.readOnlyHint']()}
				</Text>
				{isBlocking ? (
					<Button
						className={css.button}
						color="secondary_inverted"
						label={m['common.block.action.unblock']()}
						onClick={onUnblockPress}
						size="large"
					>
						<ButtonIcon icon={PersonCheckIcon} />
						<ButtonText>{m['common.block.action.unblock']()}</ButtonText>
					</Button>
				) : null}
				<Button
					className={css.button}
					color="secondary_inverted"
					label={m['common.chat.action.leave']()}
					onClick={() => leaveConvoPromptHandle.open(null)}
					size="large"
				>
					<ButtonIcon icon={LeaveIcon} />
					<ButtonText>{m['common.chat.action.leave']()}</ButtonText>
				</Button>
				<LeaveConvoPrompt convoId={convoId} currentScreen="conversation" handle={leaveConvoPromptHandle} />
				<BlockedByListDialog handle={blockedByListPromptHandle} listBlocks={listBlocks} />
			</div>
		</div>
	);
}
