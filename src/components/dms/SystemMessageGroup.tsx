import { Pressable, View } from 'react-native';
import type { ChatBskyActorDefs } from '@atcute/bluesky';

import { HITSLOP_10 } from '#/lib/constants';

import type { SystemMessageGroupItem } from '#/screens/Messages/components/groupSystemMessages';

import { atoms as a, useTheme } from '#/alf';

import { SystemMessageItem } from '#/components/dms/SystemMessageItem';
import { ChevronBottom_Stroke2_Corner0_Rounded as ChevronDown } from '#/components/icons/Chevron';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

export function SystemMessageGroup({
	item,
	expanded,
	onToggle,
	relatedProfiles,
}: {
	item: SystemMessageGroupItem;
	expanded: boolean;
	onToggle: (key: string) => void;
	relatedProfiles: Map<string, ChatBskyActorDefs.ProfileViewBasic>;
}) {
	const t = useTheme();
	const count = item.items.length;

	const label = m['components.dms.update.count']({ count });

	const chevronStyle = {
		transform: [{ rotate: `${expanded ? -180 : 0}deg` }],
	};

	return (
		<View>
			<Pressable
				testID="systemMessageGroupToggle"
				accessibilityRole="button"
				accessibilityLabel={label}
				accessibilityHint={
					expanded
						? m['components.dms.group.action.hideUpdates']()
						: m['components.dms.group.action.showUpdates']()
				}
				accessibilityState={{ expanded }}
				hitSlop={HITSLOP_10}
				onPress={() => onToggle(item.key)}
				style={[a.w_full, a.flex_row, a.align_center, a.justify_center, a.px_md, a.mt_md]}
			>
				<Text
					style={[
						a.text_xs,
						a.text_center,
						t.atoms.text_contrast_medium,
						{ includeFontPadding: false, textAlignVertical: 'center' },
					]}
				>
					{label}
				</Text>
				<View style={[a.ml_2xs, chevronStyle]}>
					<ChevronDown size="xs" style={t.atoms.text_contrast_medium} />
				</View>
			</Pressable>
			<View>
				{expanded
					? item.items.map((child) => (
							<View key={child.key}>
								<SystemMessageItem item={child} relatedProfiles={relatedProfiles} />
							</View>
						))
					: null}
			</View>
		</View>
	);
}
