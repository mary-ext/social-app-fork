import { type ComponentPropsWithoutRef, type MouseEvent, useRef } from 'react';

import { useNavigation, useNavigationState } from '@react-navigation/native';
import { clsx } from 'clsx';

import { useHideBottomBarBorder } from '#/lib/hooks/useHideBottomBarBorder';
import { getCurrentRoute, getTabState, isTab, TabState } from '#/lib/routes/helpers';
import { makeProfileLink } from '#/lib/routes/links';
import type { CommonNavigatorParams, NavigationProp } from '#/lib/routes/types';

import { softReset } from '#/state/events';
import { useUnreadMessageCount } from '#/state/queries/messages/list-conversations';
import { useUnreadNotifications } from '#/state/queries/notifications/unread';
import { useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { Logo } from '#/view/icons/Logo';
import { Logotype } from '#/view/icons/Logotype';

import { useGlobalDialogsHandleContext } from '#/components/dialogs/Context';
import {
	Bell_Stroke2_Corner0_Rounded as Bell,
	Bell_Filled_Corner0_Rounded as BellFilled,
} from '#/components/icons/Bell';
import {
	HomeOpen_Stoke2_Corner0_Rounded as Home,
	HomeOpen_Filled_Corner0_Rounded as HomeFilled,
} from '#/components/icons/HomeOpen';
import {
	MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlass,
	MagnifyingGlass_Filled_Stroke2_Corner0_Rounded as MagnifyingGlassFilled,
} from '#/components/icons/MagnifyingGlass';
import {
	Message_Stroke2_Corner0_Rounded as Message,
	Message_Stroke2_Corner0_Rounded_Filled as MessageFilled,
} from '#/components/icons/Message';
import { Text } from '#/components/Text';
import { UserAvatar } from '#/components/UserAvatar';
import { Button, ButtonText } from '#/components/web/Button';
import { Link } from '#/components/web/Link';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './BottomBarWeb.css';

const iconWidth = 24;

// a modified/middle click means the user wants a new tab — let the native anchor handle it instead of
// soft-resetting or navigating in place.
const isModifiedClick = (e: MouseEvent<HTMLElement>) => {
	return e.altKey || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey;
};

const LONG_PRESS_MS = 500;

type AnchorPressHandlers = Pick<
	ComponentPropsWithoutRef<'a'>,
	'onContextMenu' | 'onPointerCancel' | 'onPointerDown' | 'onPointerLeave' | 'onPointerUp'
>;

/**
 * synthesize long press behavior for DOM elements. a primary press held past the threshold fires the callback
 * and flags the gesture, letting the subsequent click be swallowed.
 *
 * @param onLongPress callback invoked when a press is held past the threshold; omit to disable the gesture
 * @returns pointer handlers to spread onto the anchor, and `consumeLongPress` for the click handler to check
 */
const useLongPress = (onLongPress?: () => void) => {
	const firedRef = useRef(false);
	const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	const cancel = () => {
		clearTimeout(timerRef.current);
		timerRef.current = undefined;
	};

	const handlers: AnchorPressHandlers | undefined = !onLongPress
		? undefined
		: {
				// the browser's own long-press / right-click menu would race our gesture, so suppress it
				onContextMenu: (e) => e.preventDefault(),
				onPointerCancel: cancel,
				onPointerDown: (e) => {
					if (e.button !== 0) {
						return;
					}
					firedRef.current = false;
					cancel();
					timerRef.current = setTimeout(() => {
						firedRef.current = true;
						onLongPress();
					}, LONG_PRESS_MS);
				},
				onPointerLeave: cancel,
				onPointerUp: cancel,
			};

	// true at most once per gesture — lets the click handler swallow the click trailing a long press
	const consumeLongPress = () => {
		if (firedRef.current) {
			firedRef.current = false;
			return true;
		}
		return false;
	};

	return { consumeLongPress, handlers };
};

export function BottomBarWeb() {
	const { hasSession, currentAccount } = useSession();
	const { signinDialogHandle } = useGlobalDialogsHandleContext();
	const hideBorder = useHideBottomBarBorder();
	const { data: profile } = useProfileQuery({ did: currentAccount?.did });
	const isLabeler = profile?.associated?.labeler;

	const unreadMessageCount = useUnreadMessageCount();
	const notificationCountStr = useUnreadNotifications();

	const showSignIn = () => {
		signinDialogHandle.openWithPayload({});
	};

	const onLongPressProfile = () => {
		signinDialogHandle.openWithPayload({ intent: 'switch' });
	};

	return (
		<nav className={clsx(css.bottomBar, hideBorder && css.bottomBarHideBorder)}>
			{hasSession ? (
				<>
					<NavItem routeName="Home" href="/">
						{({ isActive }) => {
							const Icon = isActive ? HomeFilled : Home;
							return <Icon aria-hidden={true} width={iconWidth} fill={colors.text} />;
						}}
					</NavItem>
					<NavItem routeName="Search" href="/search">
						{({ isActive }) => {
							const Icon = isActive ? MagnifyingGlassFilled : MagnifyingGlass;
							return <Icon aria-hidden={true} width={iconWidth} fill={colors.text} />;
						}}
					</NavItem>
					<NavItem
						routeName="Messages"
						href="/messages"
						notificationCount={unreadMessageCount.numUnread}
						hasNew={unreadMessageCount.hasNew}
					>
						{({ isActive }) => {
							const Icon = isActive ? MessageFilled : Message;
							return <Icon aria-hidden={true} width={iconWidth} fill={colors.text} />;
						}}
					</NavItem>
					<NavItem routeName="Notifications" href="/notifications" notificationCount={notificationCountStr}>
						{({ isActive }) => {
							const Icon = isActive ? BellFilled : Bell;
							return <Icon aria-hidden={true} width={iconWidth} fill={colors.text} />;
						}}
					</NavItem>
					<NavItem
						routeName="Profile"
						href={currentAccount ? makeProfileLink({ did: currentAccount.did }) : '/'}
						onLongPress={onLongPressProfile}
					>
						{({ isActive }) => (
							<UserAvatar
								avatar={profile?.avatar}
								size={iconWidth}
								type={isLabeler ? 'labeler' : 'user'}
								className={clsx(css.avatarRing, isActive && css.avatarRingActive)}
							/>
						)}
					</NavItem>
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
						onClick={showSignIn}
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

const NavItem: React.FC<{
	children: (props: { isActive: boolean }) => React.ReactNode;
	href: string;
	routeName: string;
	hasNew?: boolean;
	notificationCount?: string;
	onLongPress?: () => void;
}> = ({ children, href, routeName, hasNew, notificationCount, onLongPress }) => {
	const { currentAccount } = useSession();
	const navigation = useNavigation<NavigationProp>();
	const { consumeLongPress, handlers: longPressHandlers } = useLongPress(onLongPress);
	const currentRoute = useNavigationState((state) => {
		if (!state) {
			return { name: 'Home' };
		}
		return getCurrentRoute(state);
	});

	// the Profile tab is special: it's only "active" on your *own* profile, so viewing someone else's
	// profile leaves the tab inactive and makes a press push a fresh screen instead of resetting. Every
	// other tab is a plain name match (`isTab` also covers the `*Tab`/`*Inner` route aliases).
	const onProfileTab = routeName === 'Profile' && currentRoute.name === 'Profile';
	const isOnDifferentProfile =
		onProfileTab && (currentRoute.params as CommonNavigatorParams['Profile']).name !== currentAccount?.did;
	const isActive = onProfileTab ? !isOnDifferentProfile : isTab(currentRoute.name, routeName);

	// tapping the active tab at its root soft-resets the feed; a deeper stack pops to root (handled by the
	// link's `navigate` action). A different profile pushes a fresh screen instead.
	const action = isOnDifferentProfile ? 'push' : 'navigate';
	const onPress = (e: MouseEvent<HTMLElement>) => {
		// a long press already handled this interaction; don't also navigate on the trailing click
		if (consumeLongPress()) {
			return false;
		}
		if (action !== 'navigate' || isModifiedClick(e)) {
			return;
		}
		if (getTabState(navigation.getState(), routeName) === TabState.InsideAtRoot) {
			softReset.emit();
			return false;
		}
	};

	return (
		<Link
			to={href}
			action={action}
			onPress={onPress}
			label={routeName}
			className={css.ctrl}
			{...longPressHandlers}
		>
			{children({ isActive })}
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
};
