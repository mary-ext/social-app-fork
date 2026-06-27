import { useLingui } from '@lingui/react/macro';

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
			<Dialog.Popup className={styles.popup} label={m['screens.settings.label.allowNotifyingOthers']()}>
				<Inner />
				<Dialog.Close />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function Inner() {
	const { t: l } = useLingui();
	const { data: declaration, isError, isPending } = useNotificationDeclarationQuery();
	const { mutate } = useNotificationDeclarationMutation();

	const onChangeFilter = ([value]: string[]) => {
		mutate({ $type: 'app.bsky.notification.declaration', allowSubscriptions: value! });
	};

	return (
		<>
			<div className={styles.header}>
				<Text size="lg" weight="semiBold">
					{m['screens.settings.label.allowNotifyingOthers']()}
				</Text>
				<Text color="textContrastMedium" size="sm">
					{m['screens.settings.activitySubscription.prompt']()}
				</Text>
			</div>
			{isError ? (
				<Admonition type="error">{m['screens.settings.error.failedLoadPreference']()}</Admonition>
			) : isPending ? (
				<div className={styles.loaderWrap}>
					<Spinner color="currentColor" label={m['common.label.loading']()} size="xl" />
				</div>
			) : (
				<Toggle.Group
					className={styles.radioList}
					label={m['screens.settings.hint.filterWhoCanReceive']()}
					onChange={onChangeFilter}
					type="radio"
					values={[declaration.value.allowSubscriptions]}
				>
					<Toggle.RadioItem label={m['screens.settings.option.anyoneWhoFollowsMe']()} value="followers">
						<Toggle.Panel>
							<Toggle.RadioIndicator />
							<Toggle.PanelText>{m['screens.settings.option.anyoneWhoFollowsMe']()}</Toggle.PanelText>
						</Toggle.Panel>
					</Toggle.RadioItem>
					<Toggle.RadioItem label={m['screens.settings.option.onlyFollowersIFollow']()} value="mutuals">
						<Toggle.Panel>
							<Toggle.RadioIndicator />
							<Toggle.PanelText>{m['screens.settings.option.onlyFollowersIFollow']()}</Toggle.PanelText>
						</Toggle.Panel>
					</Toggle.RadioItem>
					<Toggle.RadioItem label={l({ context: 'enable for', message: `No one` })} value="none">
						<Toggle.Panel>
							<Toggle.RadioIndicator />
							<Toggle.PanelText>{m['screens.messages.option.noOneInvites']()}</Toggle.PanelText>
						</Toggle.Panel>
					</Toggle.RadioItem>
				</Toggle.Group>
			)}
		</>
	);
}
