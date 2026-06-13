import { Trans, useLingui } from '@lingui/react/macro';

import {
	useNotificationDeclarationMutation,
	useNotificationDeclarationQuery,
} from '#/state/queries/activity-subscriptions';

import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import { Admonition } from '#/components/web/Admonition';
import * as Dialog from '#/components/web/Dialog';
import * as Toggle from '#/components/web/forms/Toggle';

import * as styles from './ActivitySubscriptionDialog.css';

export function ActivitySubscriptionDialog({ handle }: { handle: Dialog.DialogHandle }) {
	const { t: l } = useLingui();
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup className={styles.popup} label={l`Allow notifying others of my posts`}>
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
					<Trans>Allow notifying others of my posts</Trans>
				</Text>
				<Text color="textContrastMedium" leading="snug" size="sm">
					<Trans>
						This feature allows users to receive notifications for your new posts and replies. Who do you want
						to enable this for?
					</Trans>
				</Text>
			</div>
			{isError ? (
				<Admonition type="error">
					<Trans>Failed to load preference.</Trans>
				</Admonition>
			) : isPending ? (
				<div className={styles.loaderWrap}>
					<Spinner color="currentColor" label={l`Loading`} size="xl" />
				</div>
			) : (
				<Toggle.Group
					className={styles.radioList}
					label={l`Filter who can opt to receive notifications for your activity`}
					onChange={onChangeFilter}
					type="radio"
					values={[declaration.value.allowSubscriptions]}
				>
					<Toggle.RadioItem label={l`Anyone who follows me`} value="followers">
						<Toggle.Panel>
							<Toggle.RadioIndicator />
							<Toggle.PanelText>
								<Trans>Anyone who follows me</Trans>
							</Toggle.PanelText>
						</Toggle.Panel>
					</Toggle.RadioItem>
					<Toggle.RadioItem label={l`Only followers who I follow`} value="mutuals">
						<Toggle.Panel>
							<Toggle.RadioIndicator />
							<Toggle.PanelText>
								<Trans>Only followers who I follow</Trans>
							</Toggle.PanelText>
						</Toggle.Panel>
					</Toggle.RadioItem>
					<Toggle.RadioItem label={l({ context: 'enable for', message: `No one` })} value="none">
						<Toggle.Panel>
							<Toggle.RadioIndicator />
							<Toggle.PanelText>
								<Trans context="enable for">No one</Trans>
							</Toggle.PanelText>
						</Toggle.Panel>
					</Toggle.RadioItem>
				</Toggle.Group>
			)}
		</>
	);
}
