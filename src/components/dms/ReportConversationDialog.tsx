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
	did: string;
	onAfterSubmit?: () => void;
}) {
	return <ReportDialog handle={handle} subject={{ convoId, did }} onAfterSubmit={onAfterSubmit} />;
}
