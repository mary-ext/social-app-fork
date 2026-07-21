import type { Did } from '@atcute/lexicons';

import type { DialogHandle } from '#/components/Dialog';
import { ReportDialog } from '#/components/moderation/ReportDialog';

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
