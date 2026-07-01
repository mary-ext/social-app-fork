import { ReportDialog } from '#/components/moderation/ReportDialog';
import type { DialogHandle } from '#/components/web/Dialog';

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
