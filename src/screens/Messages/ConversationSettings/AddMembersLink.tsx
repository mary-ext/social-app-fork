import { View } from 'react-native';

import { createSanitizedDisplayName } from '#/lib/moderation/create-sanitized-display-name';

import { useAddGroupMembers } from '#/state/queries/messages/add-group-members';

import { logger } from '#/logger';

import { atoms as a, useTheme } from '#/alf';

import { Button } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { AddMembersFlow } from '#/components/dms/AddMembersFlow';
import type { ConvoWithDetails } from '#/components/dms/util';
import { ChevronRight_Stroke2_Corner0_Rounded as ChevronIcon } from '#/components/icons/Chevron';
import { PlusLarge_Stroke2_Corner0_Rounded as PlusIcon } from '#/components/icons/Plus';
import { Loader } from '#/components/Loader';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

export function AddMembersLink({
	convo,
	disabled,
}: {
	convo: Extract<ConvoWithDetails, { kind: 'group' }>;
	disabled?: boolean;
}) {
	const t = useTheme();

	const addMembersControl = Dialog.useDialogControl();

	const convoId = convo.view.id;
	const { mutate: addGroupMembers, isPending: isAddPending } = useAddGroupMembers(convoId, {
		onSuccess: (data) => {
			addMembersControl.close(() => {
				const members = data.addedMembers ?? [];

				let names = null;
				if (members.length === 1) {
					names = m['screens.messages.addedToChat.one']({ name: createSanitizedDisplayName(members[0]!) });
				} else if (members.length === 2) {
					names = m['screens.messages.addedToChat.two']({
						member1: createSanitizedDisplayName(members[0]!),
						member2: createSanitizedDisplayName(members[1]!),
					});
				} else if (members.length > 2) {
					const memberCount = convo.details.memberCount - 2;
					names = m['screens.messages.addedToChat.many']({
						member1: createSanitizedDisplayName(members[0]!),
						member2: createSanitizedDisplayName(members[1]!),
						memberCount,
					});
				}

				if (names) Toast.show(names);
			});
		},
		onError: (e) => {
			logger.error('Failed to add group chat members', { message: e });
			Toast.show(m['screens.messages.error.addMembers'](), { type: 'error' });
		},
	});

	return (
		<>
			<Button
				disabled={disabled || isAddPending}
				label={m['screens.messages.action.addMembers']()}
				onPress={addMembersControl.open}
			>
				{({ interacting }) => (
					<View
						style={[
							a.w_full,
							a.flex_row,
							a.align_center,
							a.justify_between,
							a.px_xl,
							a.py_sm,
							interacting ? [t.atoms.bg_contrast_25] : [],
						]}
					>
						<View style={[a.flex_row, a.align_center]}>
							<View
								style={[
									a.flex_row,
									a.align_center,
									a.justify_center,
									a.p_lg,
									a.rounded_full,
									interacting ? t.atoms.bg_contrast_100 : t.atoms.bg_contrast_50,
									{
										height: 48,
										width: 48,
									},
								]}
							>
								<PlusIcon fill={colors.textContrastHigh} size="sm" />
							</View>
							<Text numberOfLines={1} style={[a.text_md, a.font_semi_bold, a.mx_sm, t.atoms.text]}>
								{m['screens.messages.action.addMembers']()}
							</Text>
						</View>
						{isAddPending ? <Loader size="md" /> : <ChevronIcon fill={colors.textContrastMedium} size="md" />}
					</View>
				)}
			</Button>

			<Dialog.Outer control={addMembersControl} testID="addChatMembersDialog">
				<Dialog.Handle />
				<AddMembersFlow
					convo={convo}
					title={m['screens.messages.action.addMembers']()}
					onAddMembers={(members, profiles) => {
						addGroupMembers({ members, profiles });
					}}
				/>
			</Dialog.Outer>
		</>
	);
}
