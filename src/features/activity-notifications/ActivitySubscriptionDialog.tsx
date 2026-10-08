import { RadioGroup } from '@base-ui/react/radio-group';

import {
	useNotificationDeclarationMutation,
	useNotificationDeclarationQuery,
} from '#/features/activity-notifications/queries';

import * as Dialog from '#/components/Dialog';
import * as ChoiceCard from '#/components/forms/ChoiceCard';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import { Admonition } from '#/components/web/Admonition';

import CircleBanIcon from '#/icons/central/CircleBanSign_round_outlined_radius1_stroke2.svg';
import PeopleIcon from '#/icons/central/People_round_outlined_radius1_stroke2.svg';
import PeopleAddedIcon from '#/icons/central/PeopleAdded_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import * as styles from './ActivitySubscriptionDialog.css';

export function ActivitySubscriptionDialog({ handle }: { handle: Dialog.DialogHandle }) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup size="narrow" label={m['screens.settings.activitySubscription.allowNotifying']()}>
				<Inner />
				<Dialog.Close variant="floating" />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function Inner() {
	const { data: declaration, isError, isPending } = useNotificationDeclarationQuery();
	const { mutate } = useNotificationDeclarationMutation();

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
					<Spinner color="default" label={m['common.status.loading']()} size="_2xl" />
				</div>
			) : (
				<RadioGroup
					aria-label={m['screens.settings.activitySubscription.filterHint']()}
					onValueChange={(value: string) => {
						mutate({ $type: 'app.bsky.notification.declaration', allowSubscriptions: value });
					}}
					render={<ChoiceCard.List />}
					value={declaration.value.allowSubscriptions}
				>
					<ChoiceCard.Radio
						icon={PeopleIcon}
						titleText={m['screens.settings.audience.anyoneWhoFollowsMe']()}
						value="followers"
					/>
					<ChoiceCard.Radio
						icon={PeopleAddedIcon}
						titleText={m['screens.settings.audience.onlyFollowersIFollow']()}
						value="mutuals"
					/>
					<ChoiceCard.Radio
						icon={CircleBanIcon}
						titleText={m['screens.settings.audience.noOne']()}
						value="none"
					/>
				</RadioGroup>
			)}
		</>
	);
}
