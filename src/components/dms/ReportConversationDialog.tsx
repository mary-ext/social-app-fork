import { ReportDialog } from '#/components/moderation/ReportDialog';
import type { DialogHandle } from '#/components/web/Dialog';

export function ReportConversationDialog({
	control,
	convoId,
	did,
	onAfterSubmit,
}: {
	control: DialogHandle;
	convoId: string;
	did: string;
	onAfterSubmit?: () => void;
}) {
	return <ReportDialog control={control} subject={{ convoId, did }} onAfterSubmit={onAfterSubmit} />;
}
