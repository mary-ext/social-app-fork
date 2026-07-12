import { useState } from 'react';

import type { AnyProfileView } from '@atcute/bluesky';

import { useListConvoMembersQuery } from '#/state/queries/messages/list-convo-members';

import { SelectMembersStep } from '#/components/dms/dialogs/MemberPicker';
import * as css from '#/components/dms/dialogs/MemberPicker.css';
import type { ConvoWithDetails } from '#/components/dms/util';
import { Button, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';

import { m } from '#/paraglide/messages';

export function AddMembersDialog({
	convo,
	handle,
	isPending,
	onAddMembers,
	title,
}: {
	convo: Extract<ConvoWithDetails, { kind: 'group' }>;
	handle: Dialog.DialogHandle;
	isPending: boolean;
	onAddMembers: (dids: string[], profiles: AnyProfileView[]) => void;
	title: string;
}) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup className={css.popup} label={title} scroll="body">
				<DialogInner
					convo={convo}
					handle={handle}
					isPending={isPending}
					onAddMembers={onAddMembers}
					title={title}
				/>
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({
	convo,
	handle,
	isPending,
	onAddMembers,
	title,
}: {
	convo: Extract<ConvoWithDetails, { kind: 'group' }>;
	handle: Dialog.DialogHandle;
	isPending: boolean;
	onAddMembers: (dids: string[], profiles: AnyProfileView[]) => void;
	title: string;
}) {
	const { data: existingMembers = convo.members } = useListConvoMembersQuery({
		convoId: convo.view.id,
		placeholderData: convo.members,
	});
	const excludeDids = new Set(existingMembers.map((profile) => profile.did));
	const remainingSlots = Math.max(0, convo.details.memberLimit - existingMembers.length);

	const [members, setMembers] = useState<AnyProfileView[]>([]);

	const onMembersChange = (next: AnyProfileView[]) => {
		if (next.length > remainingSlots) {
			return;
		}
		setMembers(next);
	};

	const removeMember = (did: string) => {
		setMembers((prev) => prev.filter((profile) => profile.did !== did));
	};

	return (
		<SelectMembersStep
			excludeDids={excludeDids}
			memberLimit={remainingSlots}
			members={members}
			onClose={() => handle.close()}
			onMembersChange={onMembersChange}
			onRemoveMember={removeMember}
			primaryButton={
				<Button
					color="primary"
					disabled={members.length === 0 || isPending}
					label={m['screens.messages.members.add.action']()}
					onClick={() =>
						onAddMembers(
							members.map((profile) => profile.did),
							members,
						)
					}
					size="small"
				>
					<ButtonText>{m['common.action.add']()}</ButtonText>
				</Button>
			}
			title={title}
		/>
	);
}
