import { UNREAD_REQUEST_CAP } from '#/state/queries/messages/get-unread-counts';

import { Inbox_Stroke2_Corner2_Rounded as InboxIcon } from '#/components/icons/Inbox';
import { ButtonIcon, ButtonText } from '#/components/web/Button';
import { LinkButton } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

import * as css from './InboxRequests.css';

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
				<LinkButton
					label={label}
					to="/messages/inbox"
					action={action}
					size="small"
					variant={unread ? 'solid' : 'ghost'}
					color={unread ? 'primary_subtle' : 'secondary'}
					shape={unread ? 'default' : 'round'}
					className={unread ? css.unreadPill : undefined}
				>
					<ButtonIcon icon={InboxIcon} size="lg" />
					{unread && (
						<ButtonText size="md">
							{overflow
								? m['screens.messages.requests.shortCountOverflow']({ count: UNREAD_REQUEST_CAP - 1 })
								: count}
						</ButtonText>
					)}
				</LinkButton>
			);
		}
		case 'solid': {
			return (
				<LinkButton
					label={label}
					to="/messages/inbox"
					action={action}
					color={unread ? 'primary_subtle' : 'secondary'}
					size="small"
				>
					<ButtonIcon icon={InboxIcon} />
					<ButtonText>{label}</ButtonText>
				</LinkButton>
			);
		}
	}
}
