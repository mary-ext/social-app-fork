import type { CSSProperties } from 'react';

import type { AppBskyEmbedRecord } from '@atcute/bluesky';
import type { $type } from '@atcute/lexicons';

import { Embed, PostEmbedViewContext } from '#/components/Post/Embed';

import { MessageContextProvider } from './MessageContext';
import * as css from './MessageItemEmbed.css';

const BORDER_RADIUS = 20;
const SQUARED_BORDER_RADIUS = 4;

// squares off the trailing corners on the side the bubble is anchored to, matching the text bubble's
// clustering logic (right side for self, left side for others).
export function cornerRadii({
	isFromSelf,
	squaredBottomCorner,
	squaredTopCorner,
}: {
	isFromSelf: boolean;
	squaredBottomCorner: boolean;
	squaredTopCorner: boolean;
}): CSSProperties {
	const top = squaredTopCorner ? SQUARED_BORDER_RADIUS : BORDER_RADIUS;
	const bottom = squaredBottomCorner ? SQUARED_BORDER_RADIUS : BORDER_RADIUS;
	if (isFromSelf) {
		return {
			borderTopLeftRadius: BORDER_RADIUS,
			borderTopRightRadius: top,
			borderBottomRightRadius: bottom,
			borderBottomLeftRadius: BORDER_RADIUS,
		};
	}
	return {
		borderTopLeftRadius: top,
		borderTopRightRadius: BORDER_RADIUS,
		borderBottomRightRadius: BORDER_RADIUS,
		borderBottomLeftRadius: bottom,
	};
}

function MessageItemEmbed({
	embed,
	isFromSelf,
	isGroupChat,
	squaredTopCorner,
	squaredBottomCorner,
}: {
	embed: $type.enforce<AppBskyEmbedRecord.View>;
	isFromSelf: boolean;
	isGroupChat: boolean;
	squaredTopCorner: boolean;
	squaredBottomCorner: boolean;
}): React.ReactNode {
	return (
		<MessageContextProvider>
			<div className={css.outer({ indent: !isFromSelf && isGroupChat })}>
				<div
					className={css.inner({ fromSelf: isFromSelf })}
					style={cornerRadii({ isFromSelf, squaredBottomCorner, squaredTopCorner })}
				>
					<Embed allowNestedQuotes embed={embed} viewContext={PostEmbedViewContext.ChatMessage} />
				</div>
			</div>
		</MessageContextProvider>
	);
}
export { MessageItemEmbed };
