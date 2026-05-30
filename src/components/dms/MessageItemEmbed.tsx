import { memo } from 'react';
import { View } from 'react-native';
import { type AppBskyEmbedRecord, type AppBskyFeedDefs } from '@atcute/bluesky';
import { type $type } from '@atcute/lexicons';

import { atoms as a, useTheme } from '#/alf';

import { Embed, PostEmbedViewContext } from '#/components/Post/Embed';

import { MessageContextProvider } from './MessageContext';

const BORDER_RADIUS = 20;
const SQUARED_BORDER_RADIUS = 4;

let MessageItemEmbed = ({
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
}): React.ReactNode => {
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
					// Cancel the embed's internal top margin so clustered message spacing owns the gap.
					{ marginTop: -a.mt_sm.marginTop },
				]}
			>
				<View>
					<Embed
						// TODO(atcute Phase 2.4): drop cast once PostView/embed flip to @atcute
						embed={embed as unknown as AppBskyFeedDefs.PostView['embed']}
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
};
MessageItemEmbed = memo(MessageItemEmbed);
export { MessageItemEmbed };
