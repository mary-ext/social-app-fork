import { useMemo } from 'react';
import type { AppBskyNotificationDefs } from '@atcute/bluesky';
import { Trans, useLingui } from '@lingui/react/macro';

import { useNotificationSettingsUpdateMutation } from '#/state/queries/notifications/settings';

import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as Toggle from '#/components/web/forms/Toggle';

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
	const { t: l } = useLingui();

	if (!preference) {
		return (
			<div className={styles.loaderWrap}>
				<Spinner color="currentColor" label={l`Loading`} size="xl" />
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
	const { t: l } = useLingui();
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
				label={l`Select your preferred notification channels`}
				onChange={onChangeChannels}
				type="checkbox"
				values={channels}
			>
				<Toggle.Item className={styles.switchRow} label={l`Receive push notifications`} name="push">
					<Text className={styles.switchLabel} size="md">
						<Trans>Push notifications</Trans>
					</Text>
					<Toggle.Switch />
				</Toggle.Item>
				{allowDisableInApp && (
					<Toggle.Item className={styles.switchRow} label={l`Receive in-app notifications`} name="list">
						<Text className={styles.switchLabel} size="md">
							<Trans>In-app notifications</Trans>
						</Text>
						<Toggle.Switch />
					</Toggle.Item>
				)}
			</Toggle.Group>
			{'include' in preference && (
				<>
					<div className={styles.divider} />
					<Text size="md" weight="semiBold">
						<Trans>From</Trans>
					</Text>
					<Toggle.Group
						className={styles.radioList}
						disabled={channels.length === 0}
						label={l`Filter who you receive notifications from`}
						onChange={onChangeFilter}
						type="radio"
						values={[preference.include]}
					>
						<Toggle.RadioItem label={l`Everyone`} value="all">
							<Toggle.Panel>
								<Toggle.RadioIndicator />
								<Toggle.PanelText>
									<Trans>Everyone</Trans>
								</Toggle.PanelText>
							</Toggle.Panel>
						</Toggle.RadioItem>
						{name === 'chat' ? (
							<Toggle.RadioItem label={l`Accepted conversations`} value="accepted">
								<Toggle.Panel>
									<Toggle.RadioIndicator />
									<Toggle.PanelText>
										<Trans>Accepted conversations</Trans>
									</Toggle.PanelText>
								</Toggle.Panel>
							</Toggle.RadioItem>
						) : (
							<Toggle.RadioItem label={l`People I follow`} value="follows">
								<Toggle.Panel>
									<Toggle.RadioIndicator />
									<Toggle.PanelText>
										<Trans>People I follow</Trans>
									</Toggle.PanelText>
								</Toggle.Panel>
							</Toggle.RadioItem>
						)}
					</Toggle.Group>
				</>
			)}
		</div>
	);
}
