import { type KeyboardEvent, useCallback, useState } from 'react';

import { type SessionAccount, useSession, useSessionApi } from '#/state/session';

import { logger } from '#/logger';

import { AccountList } from '#/components/AccountList';
import { type SigninDialogPayload, useGlobalDialogsHandleContext } from '#/components/dialogs/Context';
import * as css from '#/components/dialogs/Signin.css';
import { At_Stroke2_Corner0_Rounded as AtIcon } from '#/components/icons/At';
import { ChevronLeft_Stroke2_Corner0_Rounded as ChevronLeftIcon } from '#/components/icons/Chevron';
import { Spinner } from '#/components/Spinner';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import { Stack } from '#/components/web/Stack';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

export function SigninDialog() {
	const { signinDialogHandle } = useGlobalDialogsHandleContext();
	return (
		<Dialog.Root handle={signinDialogHandle}>
			{({ payload }: { payload: SigninDialogPayload | undefined }) =>
				payload ? (
					<Dialog.Popup size="narrow">
						<SigninDialogInner close={() => signinDialogHandle.close()} payload={payload} />
					</Dialog.Popup>
				) : null
			}
		</Dialog.Root>
	);
}

function SigninDialogInner({ close, payload }: { close: () => void; payload: SigninDialogPayload }) {
	const { accounts } = useSession();
	const requestedAccount = payload.requestedAccount;
	const showStoredAccounts = payload.showStoredAccounts ?? true;
	const hasStoredAccounts = showStoredAccounts && accounts.length > 0;

	// The render-prop subtree remounts on each open, so the entry screen is derived once from the
	// payload: stored accounts get the chooser, everything else the new-account form.
	const [screen, setScreen] = useState<'choose' | 'new'>(() =>
		hasStoredAccounts && !requestedAccount ? 'choose' : 'new',
	);

	if (screen === 'choose') {
		return (
			<ChooseAccountScreen
				close={close}
				intent={payload.intent ?? 'signin'}
				onSelectOther={() => setScreen('new')}
			/>
		);
	}
	return (
		<NewAccountScreen
			initialHandle={requestedAccount?.handle ?? ''}
			onBack={hasStoredAccounts ? () => setScreen('choose') : undefined}
		/>
	);
}

function ChooseAccountScreen({
	close,
	intent,
	onSelectOther,
}: {
	close: () => void;
	intent: 'signin' | 'switch';
	onSelectOther: () => void;
}) {
	const { currentAccount } = useSession();
	const { login, switchAccount } = useSessionApi();
	const [pendingDid, setPendingDid] = useState<string | null>(null);

	const onSelectAccount = useCallback(
		async (account: SessionAccount) => {
			if (pendingDid) {
				return;
			}
			if (account.did === currentAccount?.did) {
				close();
				Toast.show(m['components.dialogs.account.alreadySignedIn']({ handle: account.handle }));
				return;
			}
			try {
				setPendingDid(account.did);
				await switchAccount(account);
			} catch (e) {
				logger.error('sign in dialog: resume account failed', {
					message: e instanceof Error ? e.message : String(e),
				});
				await login({ identifier: account.did });
			} finally {
				setPendingDid(null);
			}
		},
		[close, currentAccount?.did, login, pendingDid, switchAccount],
	);

	return (
		<Stack gap="lg">
			<Stack gap="xs">
				<Dialog.TitleRow>
					<Dialog.Title>
						{intent === 'switch' ? m['common.account.action.switch']() : m['common.session.action.signIn']()}
					</Dialog.Title>
					<Dialog.Close />
				</Dialog.TitleRow>

				{intent !== 'switch' && (
					<Text color="textContrastMedium">{m['components.dialogs.account.chooseDescription']()}</Text>
				)}
			</Stack>

			<AccountList
				onSelectAccount={(account) => void onSelectAccount(account)}
				onSelectOther={onSelectOther}
				otherLabel={m['components.dialogs.account.signInAnother']()}
				pendingDid={pendingDid}
			/>
		</Stack>
	);
}

function NewAccountScreen({ initialHandle, onBack }: { initialHandle: string; onBack?: () => void }) {
	const { login } = useSessionApi();
	const [identifier, setIdentifier] = useState(initialHandle);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState('');

	const onSubmit = async () => {
		const trimmed = identifier.trim();
		if (!trimmed) {
			setError(m['components.dialogs.account.handle.description']());
			return;
		}

		setError('');
		setIsSubmitting(true);
		try {
			await login({ identifier: trimmed });
		} catch (e) {
			logger.error('sign in dialog: OAuth start failed', {
				message: e instanceof Error ? e.message : String(e),
			});
			setError(m['components.dialogs.signin.startError']());
			setIsSubmitting(false);
		}
	};

	const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			void onSubmit();
		}
	};

	return (
		<Stack gap="xl">
			<Stack gap="xs">
				<Dialog.TitleRow>
					<Dialog.Title>{m['common.session.action.signIn']()}</Dialog.Title>
					<Dialog.Close />
				</Dialog.TitleRow>

				<Text color="textContrastMedium">{m['components.dialogs.signin.description']()}</Text>
			</Stack>

			<TextField.Root isInvalid={!!error}>
				<TextField.LabelText>{m['components.dialogs.account.handle.label']()}</TextField.LabelText>
				<div className={css.field}>
					<AtIcon className={css.fieldIcon} size="lg" fill={colors.contrast_500} />
					<TextField.Input
						autoCapitalize="none"
						className={css.fieldInput}
						label={m['components.dialogs.account.handle.label']()}
						onChangeText={setIdentifier}
						onKeyDown={onKeyDown}
						placeholder={m['components.dialogs.account.handle.placeholder']()}
						value={identifier}
					/>
				</div>

				{error && (
					<Text className={css.error} color="textContrastMedium" size="sm">
						{error}
					</Text>
				)}
			</TextField.Root>

			<Dialog.Actions direction="column">
				<Button
					color="primary"
					disabled={isSubmitting}
					label={m['common.session.action.signIn']()}
					onClick={() => void onSubmit()}
					variant="solid"
					size="large"
				>
					{isSubmitting ? (
						<Spinner color="white" label={m['common.status.loading']()} size="sm" />
					) : (
						<ButtonText>{m['common.session.action.signIn']()}</ButtonText>
					)}
				</Button>

				{onBack && (
					<Button
						color="secondary"
						disabled={isSubmitting}
						label={m['components.dialogs.account.back']()}
						onClick={onBack}
						variant="ghost"
						size="large"
					>
						<ButtonIcon icon={ChevronLeftIcon} />
						<ButtonText>{m['components.dialogs.account.back']()}</ButtonText>
					</Button>
				)}
			</Dialog.Actions>
		</Stack>
	);
}
