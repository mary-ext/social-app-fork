import type { AnyProfileView } from '@atcute/bluesky';

import { useSession } from '#/state/session';

import * as css from '#/components/BotAccountAlert.css';
import * as Dialog from '#/components/Dialog';
import { Bot_Filled as RobotIcon } from '#/components/icons/Bot';
import { Text } from '#/components/Text';
import { Button, ButtonText } from '#/components/web/Button';

import { navigate } from '#/Navigation';
import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

export function BotAccountAlert({
	handle,
	profile,
}: {
	handle: Dialog.DialogHandle;
	profile: AnyProfileView;
}) {
	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup label={m['common.account.automated']()} size="narrow">
				<DialogInner handle={handle} profile={profile} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function DialogInner({ handle, profile }: { handle: Dialog.DialogHandle; profile: AnyProfileView }) {
	const { currentAccount } = useSession();

	const isSelf = profile.did === currentAccount?.did;
	const description = isSelf
		? m['components.botAccountAlert.descriptionByYou']()
		: m['components.botAccountAlert.descriptionByOwner']();

	return (
		<div className={css.body}>
			<RobotIcon className={css.icon} size="4xl" fill={colors.textContrastMedium} />
			<Text align="center" className={css.text} color="textContrastHigh" size="md">
				{description}
			</Text>
			<Dialog.Actions direction="column">
				<Button color="primary" label={m['common.action.okay']()} onClick={() => handle.close()} size="large">
					<ButtonText>{m['common.action.okay']()}</ButtonText>
				</Button>

				{isSelf && (
					<Button
						color="secondary"
						label={m['components.botAccountAlert.openSettings']()}
						onClick={() => {
							handle.close();
							void navigate('AccountSettings');
						}}
						size="large"
					>
						<ButtonText>{m['components.botAccountAlert.openSettings']()}</ButtonText>
					</Button>
				)}
			</Dialog.Actions>
		</div>
	);
}
