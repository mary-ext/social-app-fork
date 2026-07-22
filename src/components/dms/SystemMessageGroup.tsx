import type { ChatBskyActorDefs } from '@atcute/bluesky';

import type { SystemMessageGroupItem } from '#/screens/Messages/components/groupSystemMessages';

import { SystemMessageItem } from '#/components/dms/SystemMessageItem';
import { ChevronBottom_Stroke2_Corner0_Rounded as ChevronDown } from '#/components/icons/Chevron';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './SystemMessageGroup.css';

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
	const count = item.items.length;

	const label = m['components.dms.update.count']({ count });

	return (
		<div>
			<button
				aria-expanded={expanded}
				aria-label={label}
				className={css.toggle}
				onClick={() => onToggle(item.key)}
				type="button"
			>
				<Text align="center" color="textContrastMedium" size="xs">
					{label}
				</Text>
				<span className={css.chevron({ expanded })}>
					<ChevronDown fill={colors.textContrastMedium} size="xs" />
				</span>
			</button>
			{expanded
				? item.items.map((child) => (
						<SystemMessageItem key={child.key} item={child} relatedProfiles={relatedProfiles} />
					))
				: null}
		</div>
	);
}
