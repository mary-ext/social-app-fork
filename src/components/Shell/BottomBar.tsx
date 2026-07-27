import type { MouseEvent } from 'react';

import { softReset } from '#/state/events';
import { useUnreadMessageCount } from '#/state/queries/messages/list-conversations';
import { useUnreadNotifications } from '#/state/queries/notifications/unread';
import { useSession } from '#/state/session';

import { signinDialogHandle } from '#/components/dialogs/handles';
import {
	Bell_Stroke2_Corner0_Rounded as Bell,
	Bell_Filled_Corner0_Rounded as BellFilled,
} from '#/components/icons/Bell';
import type { Props as SVGIconProps } from '#/components/icons/common';
import {
	HomeOpen_Stoke2_Corner0_Rounded as Home,
	HomeOpen_Filled_Corner0_Rounded as HomeFilled,
} from '#/components/icons/HomeOpen';
import { Logo } from '#/components/icons/Logo';
import { Logotype } from '#/components/icons/Logotype';
import {
	MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlass,
	MagnifyingGlass_Filled_Stroke2_Corner0_Rounded as MagnifyingGlassFilled,
} from '#/components/icons/MagnifyingGlass';
import {
	Message_Stroke2_Corner0_Rounded as Message,
	Message_Stroke2_Corner0_Rounded_Filled as MessageFilled,
} from '#/components/icons/Message';
import { Text } from '#/components/Text';
import { Button, ButtonText } from '#/components/web/Button';
import { isModifiedClick, Link } from '#/components/web/Link';

import { m } from '#/paraglide/messages';
import { type RouteTarget, useRouter, useTarget } from '#/routes';
import { colors } from '#/styles/colors';

import * as css from './BottomBar.css';

const iconWidth = 24;

export function BottomBar() {
	const { hasSession } = useSession();

	const unreadMessageCount = useUnreadMessageCount();
	const notificationCountStr = useUnreadNotifications();

	return (
		<nav className={css.bottomBar}>
			{hasSession ? (
				<>
					<NavItem to={{ name: 'Home' }} icons={{ active: HomeFilled, inactive: Home }} />
					<NavItem
						to={{ name: 'Explore' }}
						icons={{ active: MagnifyingGlassFilled, inactive: MagnifyingGlass }}
					/>
					<NavItem
						to={{ name: 'Notifications' }}
						icons={{ active: BellFilled, inactive: Bell }}
						notificationCount={notificationCountStr}
					/>
					<NavItem
						to={{ name: 'Messages' }}
						hasNew={unreadMessageCount.hasNew}
						icons={{ active: MessageFilled, inactive: Message }}
						notificationCount={unreadMessageCount.numUnread}
					/>
				</>
			) : (
				<div className={css.signInRow}>
					<div className={css.logoGroup}>
						<Logo width={24} />
						<div className={css.logotypeWrapper}>
							<Logotype width={72} fill={colors.text} />
						</div>
					</div>
					<Button
						onClick={() => signinDialogHandle.openWithPayload({})}
						label={m['common.session.action.signIn']()}
						size="small"
						variant="solid"
						color="primary"
					>
						<ButtonText>{m['common.session.action.signIn']()}</ButtonText>
					</Button>
				</div>
			)}
		</nav>
	);
}

interface NavItemProps {
	hasNew?: boolean;
	icons: {
		active: React.ComponentType<SVGIconProps>;
		inactive: React.ComponentType<SVGIconProps>;
	};
	notificationCount?: string;
	to: RouteTarget;
}
function NavItem({ hasNew, icons, notificationCount, to }: NavItemProps) {
	const routeName = to.name;
	const router = useRouter();
	const target = useTarget();

	const isActive = target.name === routeName;

	const onPress = (e: MouseEvent<HTMLElement>) => {
		if (isModifiedClick(e)) {
			return;
		}

		if (isActive) {
			softReset.emit();
			return false;
		}

		router.popTo(to);
		return false;
	};

	const Icon = isActive ? icons.active : icons.inactive;

	return (
		<Link to={to} onPress={onPress} label={routeName} className={css.ctrl}>
			<Icon aria-hidden={true} width={iconWidth} fill={colors.text} />
			{notificationCount ? (
				<Text
					size="sm"
					weight="semiBold"
					color="white"
					className={css.badge}
					aria-label={m['view.notifications.unreadCount.badge']({ count: notificationCount })}
				>
					{notificationCount}
				</Text>
			) : hasNew ? (
				<div className={css.hasNewBadge} />
			) : null}
		</Link>
	);
}
