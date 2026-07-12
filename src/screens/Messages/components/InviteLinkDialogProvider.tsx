import { createContext, useContext } from 'react';

import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useSession } from '#/state/session';

import type { ConvoWithDetails } from '#/components/dms/util';
import * as Dialog from '#/components/web/Dialog';

import { InviteLinkDialog } from './InviteLinkDialog';

const Context = createContext<Dialog.DialogHandle | null>(null);

export function useInviteLinkDialog() {
	return useContext(Context);
}

export function InviteLinkDialogProvider({
	convo,
	children,
}: {
	convo: ConvoWithDetails | undefined;
	children: React.ReactNode;
}) {
	if (convo?.kind !== 'group') {
		return <>{children}</>;
	}
	return <GroupInviteLinkDialogProvider convo={convo}>{children}</GroupInviteLinkDialogProvider>;
}

function GroupInviteLinkDialogProvider({
	convo,
	children,
}: {
	convo: Extract<ConvoWithDetails, { kind: 'group' }>;
	children: React.ReactNode;
}) {
	const { currentAccount } = useSession();
	const handle = Dialog.useDialogHandle();
	const moderationOpts = useModerationOpts();
	const owner = convo.primaryMember;

	if (!owner || !moderationOpts) {
		return <>{children}</>;
	}

	const isOwner = owner.did === currentAccount?.did;

	return (
		<Context.Provider value={handle}>
			{children}
			<InviteLinkDialog
				convo={convo}
				handle={handle}
				owner={owner}
				isOwner={isOwner}
				moderationOpts={moderationOpts}
			/>
		</Context.Provider>
	);
}
