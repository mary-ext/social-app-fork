import { profileDisplayName } from '#/lib/strings/display-names';

import { useAddGroupMembers } from '#/state/queries/messages/add-group-members';

import * as Dialog from '#/components/Dialog';
import { AddMembersDialog } from '#/components/dms/dialogs/AddMembersDialog';
import type { ConvoWithDetails } from '#/components/dms/util';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';

import ChevronIcon from '#/icons/central/ChevronRight_round_outlined_radius1_stroke2.svg';
import PlusIcon from '#/icons/central/PlusLarge_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as styles from './AddMembersLink.css';

export function AddMembersLink({ convo }: { convo: Extract<ConvoWithDetails, { kind: 'group' }> }) {
	const addMembersHandle = Dialog.useDialogHandle();

	const convoId = convo.view.id;
	const { mutate: addGroupMembers, isPending: isAddPending } = useAddGroupMembers(convoId, {
		onSuccess: (data) => {
			addMembersHandle.close();

			const members = data.addedMembers ?? [];

			let names = null;
			if (members.length === 1) {
				names = m['screens.messages.addedToChat.one']({ name: profileDisplayName(members[0]!) });
			} else if (members.length === 2) {
				names = m['screens.messages.addedToChat.two']({
					name: profileDisplayName(members[0]!),
					name2: profileDisplayName(members[1]!),
				});
			} else if (members.length > 2) {
				const memberCount = convo.details.memberCount - 2;
				names = m['screens.messages.addedToChat.many']({
					name: profileDisplayName(members[0]!),
					name2: profileDisplayName(members[1]!),
					count: memberCount,
				});
			}

			if (names) {
				Toast.show(names);
			}
		},
		onError: (e) => {
			console.error('Failed to add group chat members', e);
			Toast.show(m['screens.messages.members.add.error'](), { type: 'error' });
		},
	});

	return (
		<>
			<Dialog.Trigger
				aria-label={m['screens.messages.members.add.action']()}
				className={styles.row}
				disabled={isAddPending}
				handle={addMembersHandle}
			>
				<div className={styles.content}>
					<div className={styles.iconCircle}>
						<PlusIcon className={styles.plusIcon} />
					</div>
					<Text numberOfLines={1} weight="medium">
						{m['screens.messages.members.add.action']()}
					</Text>
				</div>
				{isAddPending ? (
					<Spinner color="default" label={m['common.status.saving']()} size="md" />
				) : (
					<ChevronIcon className={styles.chevronIcon} />
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
