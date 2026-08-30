import type { ReactNode } from 'react';

import { clsx } from 'clsx';

import { useAddGroupMembers } from '#/state/queries/messages/add-group-members';
import { useSession } from '#/state/session';

import { AvatarBubbles } from '#/components/AvatarBubbles';
import * as Dialog from '#/components/Dialog';
import { AddMembersDialog } from '#/components/dms/dialogs/AddMembersDialog';
import type { ConvoWithDetails } from '#/components/dms/util';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import ChainLinkIcon from '#/icons/central/ChainLink3_round_outlined_radius1_stroke2.svg';
import PersonPlusIcon from '#/icons/central/PeopleAdd_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { InviteLinkDialog } from './InviteLinkDialog';
import * as css from './MessagesListGroupInfoPanel.css';

export function MessagesListGroupInfoPanel({
	convo,
}: {
	convo: Extract<ConvoWithDetails, { kind: 'group' }>;
}) {
	const convoId = convo.view.id;

	const addMembersHandle = Dialog.useDialogHandle();
	const inviteLinkHandle = Dialog.useDialogHandle();

	const { currentAccount } = useSession();

	const { mutate: addGroupMembers, isPending: isAddPending } = useAddGroupMembers(convoId, {
		onSuccess: () => {
			addMembersHandle.close();
		},
		onError: (e) => {
			console.error('Failed to add group chat members', e);
			Toast.show(m['screens.messages.members.add.error'](), { type: 'error' });
		},
	});

	const isOwner = convo.primaryMember?.did === currentAccount?.did;

	const isJoinLinkEnabled = isOwner || convo.details.joinLink?.enabledStatus === 'enabled';

	const members = (convo.members ?? []).filter((profile) => profile.did !== currentAccount?.did);

	let names: ReactNode = null;
	if (members.length === 1) {
		names = m['screens.messages.newChat.one']({ name: members[0]!.handle });
	} else if (members.length === 2) {
		names = m['screens.messages.newChat.two']({
			name: members[0]!.handle,
			name2: members[1]!.handle,
		});
	} else if (members.length > 2) {
		const memberCount = convo.details.memberCount - 2;
		names = m['screens.messages.newChat.many']({
			name: members[0]!.handle,
			count: memberCount,
			name2: members[1]!.handle,
		});
	}

	const isLocked = convo.details.lockStatus !== 'unlocked';

	const showButtons = !isLocked && (isOwner || isJoinLinkEnabled);

	return (
		<>
			<div className={css.root}>
				<AvatarBubbles animate={true} profiles={convo.members} />
				{convo.details.name ? (
					<Text className={css.name} color="text" size="_2xl" weight="bold">
						{convo.details.name}
					</Text>
				) : null}
				{names ? (
					<Text
						align="center"
						className={clsx(css.names, !showButtons && css.namesBottom)}
						color="textContrastHigh"
						size="sm"
					>
						{names}
					</Text>
				) : null}
				{showButtons ? (
					<div className={css.buttonRow}>
						{isOwner ? (
							<Dialog.Trigger
								handle={addMembersHandle}
								render={
									<Button color="secondary" label={m['screens.messages.members.add.a11y']()} size="small">
										<ButtonIcon icon={PersonPlusIcon} />
										<ButtonText>{m['common.action.addPeople']()}</ButtonText>
									</Button>
								}
							/>
						) : null}
						{isJoinLinkEnabled ? (
							<Dialog.Trigger
								handle={inviteLinkHandle}
								render={
									<Button
										color="secondary"
										label={
											isOwner
												? m['screens.messages.inviteLink.manage.a11y']()
												: m['screens.messages.inviteLink.view.a11y']()
										}
										size="small"
									>
										<ButtonIcon icon={ChainLinkIcon} />
										<ButtonText>{m['screens.messages.inviteLink.label']()}</ButtonText>
									</Button>
								}
							/>
						) : null}
					</div>
				) : null}
			</div>
			{convo.primaryMember && (
				<InviteLinkDialog
					convo={convo}
					owner={convo.primaryMember}
					isOwner={isOwner}
					handle={inviteLinkHandle}
				/>
			)}
			<AddMembersDialog
				convo={convo}
				handle={addMembersHandle}
				isPending={isAddPending}
				onAddMembers={(newMembers, newProfiles) =>
					addGroupMembers({ members: newMembers, profiles: newProfiles })
				}
				title={m['common.action.addPeople']()}
			/>
		</>
	);
}
