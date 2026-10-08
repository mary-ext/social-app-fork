import { RadioGroup } from '@base-ui/react/radio-group';

import {
	type NotificationSettingsPreference,
	type NotificationSettingsPreferenceName,
	useNotificationSettingsUpdateMutation,
} from '#/state/queries/notifications/settings';

import * as Settings from '#/components/Settings';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';

import { m } from '#/paraglide/messages';

import * as styles from './PreferenceControls.css';

export function PreferenceControls({
	allowDisableInApp = true,
	name,
	preference,
	syncOthers,
}: {
	allowDisableInApp?: boolean;
	name: NotificationSettingsPreferenceName;
	preference?: NotificationSettingsPreference;
	/**
	 * keeps other preferences in sync with `name`. used for the "everything else" category which groups
	 * starterpack joins, verified, and unverified notifications into a single toggle.
	 */
	syncOthers?: NotificationSettingsPreferenceName[];
}) {
	if (!preference) {
		return (
			<div className={styles.loaderWrap}>
				<Spinner color="default" label={m['common.status.loading']()} size="_2xl" />
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

const NO_SYNC_OTHERS: NotificationSettingsPreferenceName[] = [];

export function Inner({
	allowDisableInApp,
	name,
	preference,
	syncOthers = NO_SYNC_OTHERS,
}: {
	allowDisableInApp: boolean;
	name: NotificationSettingsPreferenceName;
	preference: NotificationSettingsPreference;
	syncOthers?: NotificationSettingsPreferenceName[];
}) {
	const { mutate } = useNotificationSettingsUpdateMutation();

	const update = (newPreference: NotificationSettingsPreference) => {
		mutate({
			[name]: newPreference,
			...Object.fromEntries(syncOthers.map((key) => [key, newPreference])),
		});
	};

	const inApp = 'list' in preference ? preference.list : false;

	return (
		<div className={styles.container}>
			<Settings.Section>
				<Settings.SwitchRow
					label={m['screens.settings.notifications.channel.receivePush']()}
					onChange={(push) => update({ ...preference, push })}
					value={preference.push}
				>
					<Settings.Label titleText={m['screens.settings.notifications.channel.pushNotifications']()} />
				</Settings.SwitchRow>
				{allowDisableInApp && 'list' in preference && (
					<Settings.SwitchRow
						label={m['screens.settings.notifications.channel.receiveInApp']()}
						onChange={(list) => update({ ...preference, list })}
						value={preference.list}
					>
						<Settings.Label titleText={m['screens.settings.notifications.channel.inAppNotifications']()} />
					</Settings.SwitchRow>
				)}
			</Settings.Section>
			{'include' in preference && (
				<div className={styles.filter}>
					<Text size="md" weight="semiBold">
						{m['screens.settings.activitySubscription.from']()}
					</Text>
					<RadioGroup
						aria-label={m['screens.settings.notifications.filterHint']()}
						disabled={!preference.push && !inApp}
						onValueChange={(include: string) => update({ ...preference, include })}
						render={<Settings.Group />}
						value={preference.include}
					>
						<Settings.RadioRow label={m['screens.settings.audience.everyone']()} value="all">
							<Settings.Label titleText={m['screens.settings.audience.everyone']()} />
						</Settings.RadioRow>
						<Settings.RadioRow label={m['screens.settings.audience.peopleIFollow']()} value="follows">
							<Settings.Label titleText={m['screens.settings.audience.peopleIFollow']()} />
						</Settings.RadioRow>
					</RadioGroup>
				</div>
			)}
		</div>
	);
}
