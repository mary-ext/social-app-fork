import type { ReactNode } from 'react';
import type { AppBskyNotificationDefs } from '@atcute/bluesky';

import { useNotificationSettingsQuery } from '#/state/queries/notifications/settings';

import { PreferenceControls } from '#/screens/Settings/NotificationSettings/components/PreferenceControls';

import { Text } from '#/components/Text';
import { Admonition } from '#/components/web/Admonition';
import * as Dialog from '#/components/web/Dialog';

import { m } from '#/paraglide/messages';

import * as styles from './NotificationSettingsDialog.css';

type NotificationSettingsDialogProps = {
	allowDisableInApp?: boolean;
	handle: Dialog.DialogHandle;
	name: Exclude<keyof AppBskyNotificationDefs.Preferences, '$type'>;
	subtitleText: ReactNode;
	syncOthers?: Exclude<keyof AppBskyNotificationDefs.Preferences, '$type'>[];
	titleText: ReactNode;
};

export function NotificationSettingsDialog({
	allowDisableInApp = true,
	handle,
	name,
	subtitleText,
	syncOthers,
	titleText,
}: NotificationSettingsDialogProps) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup className={styles.popup} label={m['common.title.notificationSettings']()}>
				<Inner
					allowDisableInApp={allowDisableInApp}
					name={name}
					subtitleText={subtitleText}
					syncOthers={syncOthers}
					titleText={titleText}
				/>
				<Dialog.Close />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function Inner({
	allowDisableInApp,
	name,
	subtitleText,
	syncOthers,
	titleText,
}: Omit<NotificationSettingsDialogProps, 'handle'>) {
	const { data: preferences, isError } = useNotificationSettingsQuery();

	return (
		<>
			<div className={styles.header}>
				<Text size="lg" weight="semiBold">
					{titleText}
				</Text>
				<Text color="textContrastMedium" size="sm">
					{subtitleText}
				</Text>
			</div>
			{isError ? (
				<div className={styles.errorWrap}>
					<Admonition type="error">{m['common.error.loadNotificationSettings']()}</Admonition>
				</div>
			) : (
				<PreferenceControls
					allowDisableInApp={allowDisableInApp}
					name={name}
					preference={preferences?.[name]}
					syncOthers={syncOthers}
				/>
			)}
		</>
	);
}
