import { createContext, type ReactNode, useContext } from 'react';

import { useSession } from '#/state/session';

import * as Dialog from '#/components/Dialog';
import type { ConvoWithDetails } from '#/components/dms/util';

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
	children: ReactNode;
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
	children: ReactNode;
}) {
	const { currentAccount } = useSession();
	const handle = Dialog.useDialogHandle();
	const owner = convo.primaryMember;

	if (!owner) {
		return <>{children}</>;
	}

	const isOwner = owner.did === currentAccount?.did;

	return (
		<Context.Provider value={handle}>
			{children}
			<InviteLinkDialog convo={convo} handle={handle} owner={owner} isOwner={isOwner} />
		</Context.Provider>
	);
}
