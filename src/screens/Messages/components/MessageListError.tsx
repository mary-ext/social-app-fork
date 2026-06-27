import { useMemo } from 'react';
import { View } from 'react-native';

import { type ConvoItem, ConvoItemError } from '#/state/messages/convo/types';

import { atoms as a, useTheme } from '#/alf';

import { CircleInfo_Stroke2_Corner0_Rounded as CircleInfo } from '#/components/icons/CircleInfo';
import { createStaticClick, InlineLinkText } from '#/components/Link';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

export function MessageListError({ item }: { item: ConvoItem & { type: 'error' } }) {
	const t = useTheme();
	const { description, help, cta } = useMemo(() => {
		return {
			[ConvoItemError.FirehoseFailed]: {
				description: m['screens.messages.connection.disconnected'](),
				help: m['screens.messages.connection.reconnect.a11y'](),
				cta: m['screens.messages.connection.reconnect.action'](),
			},
			[ConvoItemError.HistoryFailed]: {
				description: m['screens.messages.conversation.loadPastError'](),
				help: m['common.a11y.pressToRetry'](),
				cta: m['common.action.retry'](),
			},
		}[item.code];
	}, [item.code]);

	return (
		<View style={[a.my_md, a.w_full, a.flex_row, a.justify_center]}>
			<View style={[a.flex_1, a.flex_row, a.align_center, a.justify_center, a.gap_sm, { maxWidth: 400 }]}>
				<CircleInfo size="sm" fill={colors.negative_400} />

				<Text style={[a.leading_snug, t.atoms.text_contrast_medium]}>
					{description}
					{item.retry && (
						<>
							{' '}
							&middot;{' '}
							<InlineLinkText
								label={help}
								{...createStaticClick(() => {
									item.retry?.();
								})}
							>
								{cta}
							</InlineLinkText>
						</>
					)}
				</Text>
			</View>
		</View>
	);
}
