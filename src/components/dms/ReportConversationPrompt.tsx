import { useLingui } from '@lingui/react/macro';

import { type DialogControlProps } from '#/components/Dialog';
import * as Prompt from '#/components/Prompt';

export function ReportConversationPrompt({ control }: { control: DialogControlProps }) {
	const { t: l } = useLingui();

	return (
		<Prompt.Basic
			control={control}
			title={l`Report conversation`}
			description={l`To report a conversation, please report one of its messages via the conversation screen. This lets our moderators understand the context of your issue.`}
			confirmButtonCta={l`I understand`}
			onConfirm={() => {}}
			showCancel={false}
		/>
	);
}
