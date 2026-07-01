import { UNREAD_REQUEST_CAP } from '#/state/queries/messages/get-unread-counts';

import { atoms as a } from '#/alf';

import { ButtonIcon, ButtonText } from '#/components/Button';
import { Inbox_Stroke2_Corner2_Rounded as InboxIcon } from '#/components/icons/Inbox';
import { Link } from '#/components/Link';

import { m } from '#/paraglide/messages';

export function InboxRequests({
	count,
	variant,
	action,
}: {
	count: number;
	variant?: 'ghost' | 'solid';
	action?: 'navigate' | 'push';
}) {
	const unread = count > 0;
	const overflow = count >= UNREAD_REQUEST_CAP;

	const label = !unread
		? m['screens.messages.requests.label']()
		: overflow
			? m['screens.messages.requests.countOverflow']({ count: UNREAD_REQUEST_CAP - 1 })
			: m['screens.messages.requests.shortCount']({ count });

	switch (variant) {
		case 'ghost': {
			return (
				<Link
					label={label}
					to="/messages/inbox"
					action={action}
					size="small"
					variant={unread ? 'solid' : 'ghost'}
					color={unread ? 'primary_subtle' : 'secondary'}
					shape={unread ? 'default' : 'round'}
					style={[a.justify_center, unread && [a.gap_sm, a.pl_lg, a.pr_md]]}
				>
					<ButtonIcon icon={InboxIcon} size="lg" />
					{unread && (
						<ButtonText style={[a.text_md, a.font_bold]}>
							{overflow
								? m['screens.messages.requests.shortCountOverflow']({ count: UNREAD_REQUEST_CAP - 1 })
								: count}
						</ButtonText>
					)}
				</Link>
			);
		}
		case 'solid': {
			return (
				<Link
					label={label}
					to="/messages/inbox"
					action={action}
					color={unread ? 'primary_subtle' : 'secondary'}
					size="small"
				>
					<ButtonIcon icon={InboxIcon} />
					<ButtonText>{label}</ButtonText>
				</Link>
			);
		}
	}
}
