import type { ComponentType, MouseEvent, SVGProps } from 'react';

import { softReset } from '#/state/events';
import { useUnreadMessageCount } from '#/state/queries/messages/list-conversations';
import { useUnreadNotifications } from '#/state/queries/notifications/unread';
import { useSession } from '#/state/session';

import { signinDialogHandle } from '#/components/dialogs/handles';
import { Text } from '#/components/Text';
import { Button, ButtonText } from '#/components/web/Button';
import { isModifiedClick, Link } from '#/components/web/Link';

import BellFilled from '#/icons/central/Bell_round_filled_radius1_stroke2.svg';
import Bell from '#/icons/central/Bell_round_outlined_radius1_stroke2.svg';
import MessageFilled from '#/icons/central/BubbleAnnotation3_round_filled_radius1_stroke2.svg';
import Message from '#/icons/central/BubbleAnnotation3_round_outlined_radius1_stroke2.svg';
import HomeFilled from '#/icons/central/HomeOpen_round_filled_radius1_stroke2.svg';
import Home from '#/icons/central/HomeOpen_round_outlined_radius1_stroke2.svg';
import MagnifyingGlassFilled from '#/icons/central/MagnifyingGlass_round_filled_radius1_stroke2.svg';
import MagnifyingGlass from '#/icons/central/MagnifyingGlass_round_outlined_radius1_stroke2.svg';
import Logo from '#/icons/original/Logo.svg';
import Logotype from '#/icons/original/Logotype.svg';
import { m } from '#/paraglide/messages';
import { type RouteTarget, useRouter, useTarget } from '#/routes';

import * as css from './BottomBar.css';

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
						<Logo className={css.logo} />
						<div className={css.logotypeWrapper}>
							<Logotype className={css.logotype} />
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
		active: ComponentType<SVGProps<SVGSVGElement>>;
		inactive: ComponentType<SVGProps<SVGSVGElement>>;
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
			<Icon aria-hidden={true} className={css.navIcon} />
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
