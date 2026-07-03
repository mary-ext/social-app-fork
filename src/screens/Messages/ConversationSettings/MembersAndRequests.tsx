import { View } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import type { NavigationProp } from '#/lib/routes/types';

import { atoms as a, useTheme } from '#/alf';

import type { ConvoWithDetails } from '#/components/dms/util';
import { createStaticClick, InlineLinkText } from '#/components/Link';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

export function MembersAndRequests({
	convo,
	requestCount,
	hasMoreRequests,
	isOwner,
}: {
	convo: Extract<ConvoWithDetails, { kind: 'group' }>;
	requestCount: number;
	hasMoreRequests: boolean;
	isOwner: boolean;
}) {
	const t = useTheme();
	const navigation = useNavigation<NavigationProp>();

	const memberCount = convo.details.memberCount;
	const memberLimit = convo.details.memberLimit;

	return (
		<View style={[a.flex_row, a.justify_between, a.px_xl, a.pt_xl, a.pb_sm]}>
			<View style={[a.flex_row, a.align_center, a.gap_xs]}>
				<Text style={[a.text_lg, a.font_semi_bold, t.atoms.text]}>
					{m['screens.messages.members.label']()}
				</Text>
				<Text style={[a.text_xs, a.font_medium, t.atoms.text_contrast_medium]}>
					{m['screens.messages.members.countRatio']({
						count: memberCount,
						limit: memberLimit,
					})}
				</Text>
			</View>
			{isOwner && requestCount > 0 ? (
				<InlineLinkText
					label={m['screens.messages.requests.viewIncoming.a11yGroup']()}
					style={[a.text_sm, a.text_right, a.font_semi_bold]}
					{...createStaticClick(() => {
						navigation.navigate('MessagesJoinRequests', {
							conversation: convo.view.id,
						});
					})}
				>
					{hasMoreRequests
						? m['screens.messages.requests.countOverflow']({ count: requestCount })
						: m['screens.messages.requests.count']({ count: requestCount })}
				</InlineLinkText>
			) : null}
		</View>
	);
}
