import {
	useNotificationDeclarationMutation,
	useNotificationDeclarationQuery,
} from '#/state/queries/activity-subscriptions';

import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import { Admonition } from '#/components/web/Admonition';
import * as Dialog from '#/components/web/Dialog';
import * as Toggle from '#/components/web/forms/Toggle';

import { m } from '#/paraglide/messages';

import * as styles from './ActivitySubscriptionDialog.css';

export function ActivitySubscriptionDialog({ handle }: { handle: Dialog.DialogHandle }) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup
				className={styles.popup}
				label={m['screens.settings.activitySubscription.allowNotifying']()}
			>
				<Inner />
				<Dialog.Close />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function Inner() {
	const { data: declaration, isError, isPending } = useNotificationDeclarationQuery();
	const { mutate } = useNotificationDeclarationMutation();

	const onChangeFilter = ([value]: string[]) => {
		mutate({ $type: 'app.bsky.notification.declaration', allowSubscriptions: value! });
	};

	return (
		<>
			<div className={styles.header}>
				<Text size="lg" weight="semiBold">
					{m['screens.settings.activitySubscription.allowNotifying']()}
				</Text>
				<Text color="textContrastMedium" size="sm">
					{m['screens.settings.activitySubscription.prompt']()}
				</Text>
			</div>
			{isError ? (
				<Admonition type="error">{m['screens.settings.preferences.error.load']()}</Admonition>
			) : isPending ? (
				<div className={styles.loaderWrap}>
					<Spinner color="currentColor" label={m['common.status.loading']()} size="2xl" />
				</div>
			) : (
				<Toggle.Group
					className={styles.radioList}
					label={m['screens.settings.activitySubscription.filterHint']()}
					onChange={onChangeFilter}
					type="radio"
					values={[declaration.value.allowSubscriptions]}
				>
					<Toggle.RadioItem label={m['screens.settings.audience.anyoneWhoFollowsMe']()} value="followers">
						<Toggle.Panel>
							<Toggle.RadioIndicator />
							<Toggle.PanelText>{m['screens.settings.audience.anyoneWhoFollowsMe']()}</Toggle.PanelText>
						</Toggle.Panel>
					</Toggle.RadioItem>
					<Toggle.RadioItem label={m['screens.settings.audience.onlyFollowersIFollow']()} value="mutuals">
						<Toggle.Panel>
							<Toggle.RadioIndicator />
							<Toggle.PanelText>{m['screens.settings.audience.onlyFollowersIFollow']()}</Toggle.PanelText>
						</Toggle.Panel>
					</Toggle.RadioItem>
					<Toggle.RadioItem label={m['screens.settings.audience.noOne']()} value="none">
						<Toggle.Panel>
							<Toggle.RadioIndicator />
							<Toggle.PanelText>{m['screens.settings.audience.noOne']()}</Toggle.PanelText>
						</Toggle.Panel>
					</Toggle.RadioItem>
				</Toggle.Group>
			)}
		</>
	);
}
