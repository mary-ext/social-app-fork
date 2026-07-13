import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name';

import { useAddGroupMembers } from '#/state/queries/messages/add-group-members';

import { logger } from '#/logger';

import * as Dialog from '#/components/Dialog';
import { AddMembersDialog } from '#/components/dms/dialogs/AddMembersDialog';
import type { ConvoWithDetails } from '#/components/dms/util';
import { ChevronRight_Stroke2_Corner0_Rounded as ChevronIcon } from '#/components/icons/Chevron';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as styles from './AddMembersLink.css';

export function AddMembersLink({
	convo,
	disabled,
}: {
	convo: Extract<ConvoWithDetails, { kind: 'group' }>;
	disabled?: boolean;
}) {
	const addMembersHandle = Dialog.useDialogHandle();

	const convoId = convo.view.id;
	const { mutate: addGroupMembers, isPending: isAddPending } = useAddGroupMembers(convoId, {
		onSuccess: (data) => {
			addMembersHandle.close();

			const members = data.addedMembers ?? [];

			let names = null;
			if (members.length === 1) {
				names = m['screens.messages.addedToChat.one']({ name: createSanitizedDisplayName(members[0]!) });
			} else if (members.length === 2) {
				names = m['screens.messages.addedToChat.two']({
					name: createSanitizedDisplayName(members[0]!),
					name2: createSanitizedDisplayName(members[1]!),
				});
			} else if (members.length > 2) {
				const memberCount = convo.details.memberCount - 2;
				names = m['screens.messages.addedToChat.many']({
					name: createSanitizedDisplayName(members[0]!),
					name2: createSanitizedDisplayName(members[1]!),
					count: memberCount,
				});
			}

			if (names) Toast.show(names);
		},
		onError: (e) => {
			logger.error('Failed to add group chat members', { message: e });
			Toast.show(m['screens.messages.members.add.error'](), { type: 'error' });
		},
	});

	return (
		<>
			<Dialog.Trigger
				aria-label={m['screens.messages.members.add.action']()}
				className={styles.row}
				disabled={disabled || isAddPending}
				handle={addMembersHandle}
			>
				<div className={styles.content}>
					<div className={styles.iconCircle}>
						<PlusIcon fill={colors.textContrastHigh} size="sm" />
					</div>
					<Text className={styles.label} numberOfLines={1} size="md" weight="semiBold">
						{m['screens.messages.members.add.action']()}
					</Text>
				</div>
				{isAddPending ? (
					<Spinner color="default" label={m['common.status.saving']()} size="lg" />
				) : (
					<ChevronIcon fill={colors.textContrastMedium} size="lg" />
				)}
			</Dialog.Trigger>
			<AddMembersDialog
				convo={convo}
				handle={addMembersHandle}
				isPending={isAddPending}
				onAddMembers={(members, profiles) => addGroupMembers({ members, profiles })}
				title={m['screens.messages.members.add.action']()}
			/>
		</>
	);
}
