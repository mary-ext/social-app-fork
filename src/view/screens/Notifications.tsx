import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect, useIsFocused } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';

import { useNonReactiveCallback } from '#/lib/hooks/useNonReactiveCallback';
import { useOpenComposer } from '#/lib/hooks/useOpenComposer';
import type { NativeStackScreenProps, NotificationsTabNavigatorParams } from '#/lib/routes/types';

import { softReset } from '#/state/events';
import { RQKEY as NOTIFS_RQKEY } from '#/state/queries/notifications/feed';
import { useNotificationSettingsQuery } from '#/state/queries/notifications/settings';
import { useUnreadNotifications, useUnreadNotificationsApi } from '#/state/queries/notifications/unread';
import { truncateAndInvalidate } from '#/state/queries/util';

import { logger } from '#/logger';

import { Trans } from '#/locale/Trans';

import { NotificationFeed } from '#/view/com/notifications/NotificationFeed';
import { FAB } from '#/view/com/util/fab/FAB';
import { LoadLatestBtn } from '#/view/com/util/load-latest/LoadLatestBtn';

import { EditBig_Stroke2_Corner2_Rounded as EditBigIcon } from '#/components/icons/EditBig';
import { SettingsGear2_Stroke2_Corner0_Rounded as SettingsIcon } from '#/components/icons/SettingsGear2';
import type { ListMethods } from '#/components/List/List';
import { Loader } from '#/components/Loader';
import { type Section, Tabs } from '#/components/Tabs';
import { Admonition } from '#/components/web/Admonition';
import { ButtonIcon } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';
import { InlineLinkText, LinkButton } from '#/components/web/Link';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './Notifications.css';

// We don't currently persist this across reloads since
// you gotta visit All to clear the badge anyway.
// But let's at least persist it during the sesssion.
let lastActiveTab: 'all' | 'mentions' = 'all';

type Props = NativeStackScreenProps<NotificationsTabNavigatorParams, 'Notifications'>;
export function NotificationsScreen({}: Props) {
	const { openComposer } = useOpenComposer();
	const unreadNotifs = useUnreadNotifications();
	const hasNew = !!unreadNotifs;
	const { checkUnread: checkUnreadAll } = useUnreadNotificationsApi();
	const [isLoadingAll, setIsLoadingAll] = useState(false);
	const [isLoadingMentions, setIsLoadingMentions] = useState(false);
	const [activeTab, setActiveTab] = useState(lastActiveTab);
	const isLoading = activeTab === 'all' ? isLoadingAll : isLoadingMentions;

	const onTabChange = useCallback((tab: 'all' | 'mentions') => {
		setActiveTab(tab);
		lastActiveTab = tab;
	}, []);

	const queryClient = useQueryClient();
	const checkUnreadMentions = useCallback(
		async ({ invalidate }: { invalidate: boolean }) => {
			if (invalidate) {
				return truncateAndInvalidate(queryClient, NOTIFS_RQKEY('mentions'));
			} else {
				// Background polling is not implemented for the mentions tab.
				// Just ignore it.
			}
		},
		[queryClient],
	);

	const sections = useMemo<Section<'all' | 'mentions'>[]>(() => {
		return [
			{
				id: 'all',
				label: m['common.status.all'](),
				render: (focused) => (
					<NotificationsTab
						filter="all"
						isActive={focused}
						isLoading={isLoadingAll}
						hasNew={hasNew}
						setIsLoadingLatest={setIsLoadingAll}
						checkUnread={checkUnreadAll}
					/>
				),
			},
			{
				id: 'mentions',
				label: m['common.mention.label'](),
				render: (focused) => (
					<NotificationsTab
						filter="mentions"
						isActive={focused}
						isLoading={isLoadingMentions}
						hasNew={false /* We don't know for sure */}
						setIsLoadingLatest={setIsLoadingMentions}
						checkUnread={checkUnreadMentions}
					/>
				),
			},
		];
	}, [hasNew, checkUnreadAll, checkUnreadMentions, isLoadingAll, isLoadingMentions]);

	return (
		<Layout.Screen>
			<Tabs
				sections={sections}
				value={activeTab}
				onValueChange={onTabChange}
				onTabReselect={() => softReset.emit()}
				header={
					<Layout.Header.Outer noBottomBorder sticky={false}>
						<Layout.Header.MenuButton />

						<Layout.Header.Content>
							<Layout.Header.TitleText>{m['common.nav.notifications']()}</Layout.Header.TitleText>
						</Layout.Header.Content>

						<Layout.Header.Slot>
							<LinkButton
								to="/settings/notifications"
								label={m['common.notifications.settingsTitle']()}
								size="small"
								variant="ghost"
								color="secondary"
								shape="round"
							>
								<ButtonIcon icon={isLoading ? Loader : SettingsIcon} size="md" />
							</LinkButton>
						</Layout.Header.Slot>
					</Layout.Header.Outer>
				}
			/>
			<FAB
				icon={<EditBigIcon size="lg" fill={colors.white} />}
				label={m['common.compose.action.new']()}
				onClick={() => openComposer({ logContext: 'Fab' })}
			/>
		</Layout.Screen>
	);
}

function NotificationsTab({
	filter,
	isActive,
	isLoading,
	hasNew,
	checkUnread,
	setIsLoadingLatest,
}: {
	filter: 'all' | 'mentions';
	isActive: boolean;
	isLoading: boolean;
	hasNew: boolean;
	checkUnread: ({ invalidate }: { invalidate: boolean }) => Promise<void>;
	setIsLoadingLatest: (v: boolean) => void;
}) {
	const [isScrolledDown, setIsScrolledDown] = useState(false);
	const scrollElRef = useRef<ListMethods>(null);
	const queryClient = useQueryClient();
	const isScreenFocused = useIsFocused();
	const isFocusedAndActive = isScreenFocused && isActive;

	// event handlers
	// =
	const scrollToTop = useCallback(() => {
		scrollElRef.current?.scrollToOffset({ animated: false, offset: 0 });
	}, [scrollElRef]);

	const onPressLoadLatest = useCallback(() => {
		scrollToTop();
		if (hasNew) {
			// render what we have now
			void truncateAndInvalidate(queryClient, NOTIFS_RQKEY(filter));
		} else if (!isLoading) {
			// check with the server
			setIsLoadingLatest(true);
			void checkUnread({ invalidate: true })
				.catch(() => undefined)
				.then(() => setIsLoadingLatest(false));
		}
	}, [scrollToTop, queryClient, checkUnread, hasNew, isLoading, setIsLoadingLatest, filter]);

	const onFocusCheckLatest = useNonReactiveCallback(() => {
		// on focus, check for latest, but only invalidate if the user
		// isnt scrolled down to avoid moving content underneath them
		let currentIsScrolledDown;
		// On the web, this isn't always updated in time so
		// we're just going to look it up synchronously.
		currentIsScrolledDown = window.scrollY > 200;
		void checkUnread({ invalidate: !currentIsScrolledDown });
	});

	// on-visible setup
	// =
	useFocusEffect(
		useCallback(() => {
			if (isFocusedAndActive) {
				logger.debug('NotificationsScreen: Focus');
				onFocusCheckLatest();
			}
		}, [onFocusCheckLatest, isFocusedAndActive]),
	);

	useEffect(() => {
		if (!isFocusedAndActive) {
			return;
		}
		return softReset.subscribe(onPressLoadLatest);
	}, [onPressLoadLatest, isFocusedAndActive]);

	return (
		<>
			<NotificationFeed
				enabled={isFocusedAndActive}
				filter={filter}
				onScrolledDownChange={setIsScrolledDown}
				scrollElRef={scrollElRef}
				ListHeaderComponent={
					filter === 'mentions' ? <DisabledNotificationsWarning active={isFocusedAndActive} /> : null
				}
			/>
			{(isScrolledDown || hasNew) && (
				<LoadLatestBtn
					onPress={onPressLoadLatest}
					label={m['view.notifications.loadNew']()}
					showIndicator={hasNew}
				/>
			)}
		</>
	);
}

function DisabledNotificationsWarning({ active }: { active: boolean }) {
	const { data } = useNotificationSettingsQuery({ enabled: active });

	if (!data) return null;

	if (!data.reply.list && !data.quote.list && !data.mention.list) {
		// mention tab notifications are disabled
		return (
			<div className={css.warning}>
				<Admonition type="warning">
					<Trans
						message={m['view.notifications.settings.disabledHint']}
						markup={{
							t0: ({ children }) => (
								<InlineLinkText label={m['view.notifications.settings.visit']()} to="/settings/notifications">
									{children}
								</InlineLinkText>
							),
						}}
					/>
				</Admonition>
			</div>
		);
	}

	return null;
}
