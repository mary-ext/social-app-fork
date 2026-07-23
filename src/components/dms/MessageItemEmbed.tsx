import type { AppBskyEmbedRecord } from '@atcute/bluesky';
import type { $type } from '@atcute/lexicons';

import { clsx } from 'clsx';

import { Embed, PostEmbedViewContext } from '#/components/Post/Embed';

import { MessageContextProvider } from './MessageContext';
import * as css from './MessageItemEmbed.css';

function MessageItemEmbed({
	embed,
	isFromSelf,
	squaredTopCorner,
	squaredBottomCorner,
}: {
	embed: $type.enforce<AppBskyEmbedRecord.View>;
	isFromSelf: boolean;
	squaredTopCorner: boolean;
	squaredBottomCorner: boolean;
}): React.ReactNode {
	return (
		<MessageContextProvider>
			<div className={css.outer}>
				<div
					className={clsx(
						css.inner({ fromSelf: isFromSelf }),
						css.bubbleCorners({
							fromSelf: isFromSelf,
							squaredBottom: squaredBottomCorner,
							squaredTop: squaredTopCorner,
						}),
					)}
				>
					<Embed allowNestedQuotes embed={embed} viewContext={PostEmbedViewContext.ChatMessage} />
				</div>
			</div>
		</MessageContextProvider>
	);
}
export { MessageItemEmbed };
