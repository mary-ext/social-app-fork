import type { AnyProfileView } from '@atcute/bluesky';
import { Trans, useLingui } from '@lingui/react/macro';

import { useSession } from '#/state/session';

import * as css from '#/components/BotAccountAlert.css';
import { Bot_Filled as RobotIcon } from '#/components/icons/Bot';
import { Text } from '#/components/Text';
import { Button, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';

import { navigate } from '#/Navigation';

export function BotAccountAlert({
	handle,
	profile,
}: {
	handle: Dialog.DialogHandle;
	profile: AnyProfileView;
}) {
	const { t: l } = useLingui();
	const { currentAccount } = useSession();

	const isSelf = profile.did === currentAccount?.did;
	const description = isSelf
		? l`You have marked this account as automated. You can remove it at any time from your account settings.`
		: l`This account has been marked as automated by its owner.`;

	return (
		<Dialog.Root handle={handle}>
			<Dialog.Popup label={l`Automated account`} size="narrow">
				<div className={css.body}>
					<span className={css.icon}>
						<RobotIcon width={48} fill="currentColor" />
					</span>
					<Text align="center" className={css.text} color="textContrastHigh" leading="snug" size="md">
						{description}
					</Text>
					<div className={css.actions}>
						<Button color="primary" label={l`Okay`} onClick={() => handle.close()} size="large">
							<ButtonText>
								<Trans>Okay</Trans>
							</ButtonText>
						</Button>
						{isSelf && (
							<Button
								color="secondary"
								label={l`Open settings`}
								onClick={() => {
									handle.close();
									void navigate('AutomationLabelSettings');
								}}
								size="large"
							>
								<ButtonText>
									<Trans>Open settings</Trans>
								</ButtonText>
							</Button>
						)}
					</div>
				</div>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
