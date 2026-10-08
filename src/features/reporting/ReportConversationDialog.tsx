import type { Did } from '@atcute/lexicons';

import { ReportDialog } from '#/features/reporting/ReportDialog';

import type { DialogHandle } from '#/components/Dialog';

export function ReportConversationDialog({
	handle,
	convoId,
	did,
	onAfterSubmit,
}: {
	handle: DialogHandle;
	convoId: string;
	did: Did;
	onAfterSubmit?: () => void;
}) {
	return <ReportDialog handle={handle} subject={{ convoId, did }} onAfterSubmit={onAfterSubmit} />;
}
