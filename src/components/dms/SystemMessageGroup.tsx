import type { ChatBskyActorDefs } from '@atcute/bluesky';

import type { SystemMessageGroupItem } from '#/screens/Messages/components/message-timeline';

import { SystemMessageItem } from '#/components/dms/SystemMessageItem';
import { Text } from '#/components/Text';

import ChevronDown from '#/icons/central/ChevronBottom_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

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
					<ChevronDown className={css.chevronDownIcon} />
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
