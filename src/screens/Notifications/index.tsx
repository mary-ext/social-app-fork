import { useRef, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { softReset } from '#/state/events';
import { notificationFeedQueryKey } from '#/state/queries/notifications/notification-feed-key';
import { useNotificationSettingsQuery } from '#/state/queries/notifications/settings';
import { useUnreadNotifications, useUnreadNotificationsApi } from '#/state/queries/notifications/unread';
import { truncateAndInvalidate } from '#/state/queries/util';
import { useTitle } from '#/state/use-title';

import { Trans } from '#/locale/Trans';

import { useOpenComposer } from '#/features/composer/open-composer';

import { NotificationFeed } from '#/screens/Notifications/components/NotificationFeed';

import { FAB } from '#/components/FAB';
import type { ListMethods } from '#/components/List/List';
import { LoadLatestBtn } from '#/components/LoadLatestBtn';
import { Spinner } from '#/components/Spinner';
import { type Section, Tabs } from '#/components/Tabs';
import { Admonition } from '#/components/web/Admonition';
import { ButtonIcon } from '#/components/web/Button';
import * as Layout from '#/components/web/Layout';
import { InlineLinkText, LinkButton } from '#/components/web/Link';

import EditBigIcon from '#/icons/central/EditBig_round_outlined_radius1_stroke2.svg';
import SettingsIcon from '#/icons/central/SettingsGear2_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useFocusEffect, useIsFocused, useParams } from '#/router';

import * as css from './index.css';

export function NotificationsScreen() {
	useTitle(m['common.nav.notifications']());
	const { openComposer } = useOpenComposer();
	const unreadNotifs = useUnreadNotifications();
	const hasNew = !!unreadNotifs;
	const { checkUnread: checkUnreadAll } = useUnreadNotificationsApi();
	const [isLoadingAll, setIsLoadingAll] = useState(false);
	const [isLoadingMentions, setIsLoadingMentions] = useState(false);
	const [{ tab }, replaceParams] = useParams('Notifications');
	const activeTab = tab ?? 'all';
	const isLoading = activeTab === 'all' ? isLoadingAll : isLoadingMentions;

	const queryClient = useQueryClient();
	const checkUnreadMentions = async ({ invalidate }: { invalidate: boolean }) => {
		if (invalidate) {
			return truncateAndInvalidate(queryClient, notificationFeedQueryKey('mentions'));
		}
	};

	const sections: Section<'all' | 'mentions'>[] = [
		{
			id: 'all',
			label: m['common.status.all'](),
			children: (
				<NotificationsTab
					filter="all"
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
			children: (
				<NotificationsTab
					filter="mentions"
					isLoading={isLoadingMentions}
					hasNew={false /* We don't know for sure */}
					setIsLoadingLatest={setIsLoadingMentions}
					checkUnread={checkUnreadMentions}
				/>
			),
		},
	];

	return (
		<Layout.Screen>
			<Tabs
				sections={sections}
				value={activeTab}
				onValueChange={(next) => replaceParams({ tab: next })}
				onTabReselect={() => softReset.emit()}
				header={
					<Layout.Header.Outer noBottomBorder sticky={false}>
						<Layout.Header.MenuButton />

						<Layout.Header.Content>
							<Layout.Header.TitleText>{m['common.nav.notifications']()}</Layout.Header.TitleText>
						</Layout.Header.Content>

						<Layout.Header.Slot>
							<LinkButton
								to={{ name: 'NotificationSettings' }}
								label={m['common.notifications.settingsTitle']()}
								size="small"
								variant="ghost"
								color="secondary"
								shape="round"
							>
								{isLoading ? (
									<Spinner color="default" label={m['common.status.loading']()} size="lg" />
								) : (
									<ButtonIcon icon={SettingsIcon} size="lg" />
								)}
							</LinkButton>
						</Layout.Header.Slot>
					</Layout.Header.Outer>
				}
			/>
			<FAB icon={EditBigIcon} label={m['common.compose.action.new']()} onClick={() => openComposer({})} />
		</Layout.Screen>
	);
}

function NotificationsTab({
	filter,
	isLoading,
	hasNew,
	checkUnread,
	setIsLoadingLatest,
}: {
	filter: 'all' | 'mentions';
	isLoading: boolean;
	hasNew: boolean;
	checkUnread: ({ invalidate }: { invalidate: boolean }) => Promise<void>;
	setIsLoadingLatest: (v: boolean) => void;
}) {
	const [isScrolledDown, setIsScrolledDown] = useState(false);
	const scrollElRef = useRef<ListMethods>(null);
	const queryClient = useQueryClient();
	const isScreenFocused = useIsFocused();

	// event handlers
	// =
	const onPressLoadLatest = () => {
		scrollElRef.current?.scrollToOffset({ animated: false, offset: 0 });
		if (hasNew) {
			// render what we have now
			void truncateAndInvalidate(queryClient, notificationFeedQueryKey(filter));
		} else if (!isLoading) {
			// check with the server
			setIsLoadingLatest(true);
			void checkUnread({ invalidate: true })
				.catch(() => undefined)
				.then(() => setIsLoadingLatest(false));
		}
	};

	// on-visible setup
	// =
	useFocusEffect(() => {
		// on focus, check for latest, but only invalidate if the user
		// isnt scrolled down to avoid moving content underneath them.
		// On the web, this isn't always updated in time so
		// we're just going to look it up synchronously.
		const currentIsScrolledDown = window.scrollY > 200;
		void checkUnread({ invalidate: !currentIsScrolledDown });
	});

	useFocusEffect(() => softReset.subscribe(onPressLoadLatest));

	return (
		<>
			<NotificationFeed
				enabled={isScreenFocused}
				filter={filter}
				onScrolledDownChange={setIsScrolledDown}
				scrollElRef={scrollElRef}
				ListHeaderComponent={
					filter === 'mentions' ? <DisabledNotificationsWarning active={isScreenFocused} /> : null
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

	if (!data) {
		return null;
	}

	if (!data.reply.list && !data.quote.list && !data.mention.list) {
		// mention tab notifications are disabled
		return (
			<div className={css.warning}>
				<Admonition type="warning">
					<Trans
						message={m['view.notifications.settings.disabledHint']}
						markup={{
							t0: ({ children }) => (
								<InlineLinkText
									label={m['view.notifications.settings.visit']()}
									to={{ name: 'NotificationSettings' }}
								>
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
