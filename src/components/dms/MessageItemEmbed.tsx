import { View } from 'react-native';
import type { AppBskyEmbedRecord } from '@atcute/bluesky';
import type { $type } from '@atcute/lexicons';

import { atoms as a, useTheme } from '#/alf';

import { Embed, PostEmbedViewContext } from '#/components/Post/Embed';

import { MessageContextProvider } from './MessageContext';

const BORDER_RADIUS = 20;
const SQUARED_BORDER_RADIUS = 4;

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
	const t = useTheme();

	return (
		<MessageContextProvider>
			<View
				style={[
					!isFromSelf && isGroupChat && a.ml_sm,
					{
						width: '100%',
						minWidth: 280,
						maxWidth: 360,
					},
				]}
			>
				<View>
					<Embed
						embed={embed}
						allowNestedQuotes
						viewContext={PostEmbedViewContext.ChatMessage}
						style={[
							a.rounded_xl,
							a.overflow_hidden,
							a.border_0,
							isFromSelf
								? {
										backgroundColor: t.palette.primary_50,
										borderBottomRightRadius: squaredBottomCorner ? SQUARED_BORDER_RADIUS : BORDER_RADIUS,
										borderTopRightRadius: squaredTopCorner ? SQUARED_BORDER_RADIUS : BORDER_RADIUS,
									}
								: {
										backgroundColor: t.palette.contrast_50,
										borderBottomLeftRadius: squaredBottomCorner ? SQUARED_BORDER_RADIUS : BORDER_RADIUS,
										borderTopLeftRadius: squaredTopCorner ? SQUARED_BORDER_RADIUS : BORDER_RADIUS,
									},
						]}
					/>
				</View>
			</View>
		</MessageContextProvider>
	);
}
export { MessageItemEmbed };
