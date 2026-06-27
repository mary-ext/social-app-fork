import { useMemo } from 'react';
import type { AppBskyNotificationDefs } from '@atcute/bluesky';

import { useNotificationSettingsUpdateMutation } from '#/state/queries/notifications/settings';

import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Toggle from '#/components/web/forms/Toggle';

import { m } from '#/paraglide/messages';

import * as styles from './PreferenceControls.css';

export function PreferenceControls({
	allowDisableInApp = true,
	name,
	preference,
	syncOthers,
}: {
	allowDisableInApp?: boolean;
	name: Exclude<keyof AppBskyNotificationDefs.Preferences, '$type'>;
	preference?:
		| AppBskyNotificationDefs.ChatPreference
		| AppBskyNotificationDefs.FilterablePreference
		| AppBskyNotificationDefs.Preference;
	/**
	 * Keep other prefs in sync with `name`. For use in the "everything else" category which groups starterpack
	 * joins + verified + unverified notifications into a single toggle.
	 */
	syncOthers?: Exclude<keyof AppBskyNotificationDefs.Preferences, '$type'>[];
}) {
	if (!preference) {
		return (
			<div className={styles.loaderWrap}>
				<Spinner color="currentColor" label={m['common.status.loading']()} size="xl" />
			</div>
		);
	}

	return (
		<Inner
			allowDisableInApp={allowDisableInApp}
			name={name}
			preference={preference}
			syncOthers={syncOthers}
		/>
	);
}

export function Inner({
	allowDisableInApp,
	name,
	preference,
	syncOthers = [],
}: {
	allowDisableInApp: boolean;
	name: Exclude<keyof AppBskyNotificationDefs.Preferences, '$type'>;
	preference:
		| AppBskyNotificationDefs.ChatPreference
		| AppBskyNotificationDefs.FilterablePreference
		| AppBskyNotificationDefs.Preference;
	syncOthers?: Exclude<keyof AppBskyNotificationDefs.Preferences, '$type'>[];
}) {
	const { mutate } = useNotificationSettingsUpdateMutation();

	const channels = useMemo(() => {
		const arr = [];
		if ('list' in preference && preference.list) arr.push('list');
		if (preference.push) arr.push('push');
		return arr;
	}, [preference]);

	const onChangeChannels = (change: string[]) => {
		const newPreference = {
			...preference,
			...('list' in preference ? { list: change.includes('list') } : {}),
			push: change.includes('push'),
		} as typeof preference;

		mutate({
			[name]: newPreference,
			...Object.fromEntries(syncOthers.map((key) => [key, newPreference])),
		});
	};

	const onChangeFilter = ([change]: string[]) => {
		if (change !== 'all' && change !== 'follows' && change !== 'accepted') throw new Error('Invalid filter');

		const newPreference = {
			...preference,
			include: change,
		} satisfies typeof preference;

		mutate({
			[name]: newPreference,
			...Object.fromEntries(syncOthers.map((key) => [key, newPreference])),
		});
	};

	return (
		<div className={styles.container}>
			<Toggle.Group
				className={styles.channels}
				label={m['screens.settings.notifications.channel.selectPrompt']()}
				onChange={onChangeChannels}
				type="checkbox"
				values={channels}
			>
				<Toggle.Item
					className={styles.switchRow}
					label={m['screens.settings.notifications.channel.receivePush']()}
					name="push"
				>
					<Text className={styles.switchLabel} size="md">
						{m['screens.settings.notifications.channel.pushNotifications']()}
					</Text>
					<Toggle.Switch />
				</Toggle.Item>
				{allowDisableInApp && (
					<Toggle.Item
						className={styles.switchRow}
						label={m['screens.settings.notifications.channel.receiveInApp']()}
						name="list"
					>
						<Text className={styles.switchLabel} size="md">
							{m['screens.settings.notifications.channel.inAppNotifications']()}
						</Text>
						<Toggle.Switch />
					</Toggle.Item>
				)}
			</Toggle.Group>
			{'include' in preference && (
				<>
					<div className={styles.divider} />
					<Text size="md" weight="semiBold">
						{m['screens.settings.activitySubscription.from']()}
					</Text>
					<Toggle.Group
						className={styles.radioList}
						disabled={channels.length === 0}
						label={m['screens.settings.notifications.filterHint']()}
						onChange={onChangeFilter}
						type="radio"
						values={[preference.include]}
					>
						<Toggle.RadioItem label={m['screens.settings.audience.everyone']()} value="all">
							<Toggle.Panel>
								<Toggle.RadioIndicator />
								<Toggle.PanelText>{m['screens.settings.audience.everyone']()}</Toggle.PanelText>
							</Toggle.Panel>
						</Toggle.RadioItem>
						{name === 'chat' ? (
							<Toggle.RadioItem label={m['screens.settings.chat.acceptedConversations']()} value="accepted">
								<Toggle.Panel>
									<Toggle.RadioIndicator />
									<Toggle.PanelText>{m['screens.settings.chat.acceptedConversations']()}</Toggle.PanelText>
								</Toggle.Panel>
							</Toggle.RadioItem>
						) : (
							<Toggle.RadioItem label={m['screens.settings.audience.peopleIFollow']()} value="follows">
								<Toggle.Panel>
									<Toggle.RadioIndicator />
									<Toggle.PanelText>{m['screens.settings.audience.peopleIFollow']()}</Toggle.PanelText>
								</Toggle.Panel>
							</Toggle.RadioItem>
						)}
					</Toggle.Group>
				</>
			)}
		</div>
	);
}
