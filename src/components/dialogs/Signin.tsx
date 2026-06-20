import { type KeyboardEvent, useCallback, useState } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';

import { type SessionAccount, useSession, useSessionApi } from '#/state/session';

import { logger } from '#/logger';

import { AccountList } from '#/components/AccountList';
import { type SigninDialogPayload, useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import * as css from '#/components/dialogs/Signin.css';
import { At_Stroke2_Corner0_Rounded as AtIcon } from '#/components/icons/At';
import { ChevronLeft_Stroke2_Corner0_Rounded as ChevronLeftIcon } from '#/components/icons/Chevron';
import { Loader } from '#/components/Loader';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';

export function SigninDialog() {
	const { t: l } = useLingui();
	const { signinDialogControl } = useGlobalDialogsControlContext();
	return (
		<Dialog.Root handle={signinDialogControl}>
			{({ payload }: { payload: SigninDialogPayload | undefined }) =>
				payload ? (
					<Dialog.Popup label={l`Sign in to Bluesky`} size="narrow">
						<SigninDialogInner close={() => signinDialogControl.close()} payload={payload} />
						<Dialog.Close />
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
		return <ChooseAccountScreen close={close} onSelectOther={() => setScreen('new')} />;
	}
	return (
		<NewAccountScreen
			initialHandle={requestedAccount?.handle ?? ''}
			onBack={hasStoredAccounts ? () => setScreen('choose') : undefined}
		/>
	);
}

function ChooseAccountScreen({ close, onSelectOther }: { close: () => void; onSelectOther: () => void }) {
	const { t: l } = useLingui();
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
				Toast.show(l`Already signed in as @${account.handle}`);
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
		[close, currentAccount?.did, l, login, pendingDid, switchAccount],
	);

	return (
		<div className={css.outer}>
			<div className={css.heading}>
				<Text size="_2xl" weight="semiBold">
					<Trans>Sign in</Trans>
				</Text>
				<Text color="textContrastHigh">
					<Trans>Choose an account to sign in with.</Trans>
				</Text>
			</div>

			<AccountList
				onSelectAccount={(account) => void onSelectAccount(account)}
				onSelectOther={onSelectOther}
				otherLabel={l`Sign in to another account`}
				pendingDid={pendingDid}
			/>
		</div>
	);
}

function NewAccountScreen({ initialHandle, onBack }: { initialHandle: string; onBack?: () => void }) {
	const { t: l } = useLingui();
	const { login } = useSessionApi();
	const [identifier, setIdentifier] = useState(initialHandle);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState('');

	const onSubmit = useCallback(async () => {
		const trimmed = identifier.trim();
		if (!trimmed) {
			setError(l`Enter your handle or DID.`);
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
			setError(l`Unable to start sign in. Please try again.`);
			setIsSubmitting(false);
		}
	}, [identifier, l, login]);

	const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault();
			void onSubmit();
		}
	};

	return (
		<div className={css.outer}>
			<div className={css.heading}>
				<Text size="_2xl" weight="semiBold">
					<Trans>Sign in</Trans>
				</Text>
				<Text color="textContrastHigh">
					<Trans>Sign in with your Bluesky account.</Trans>
				</Text>
			</div>
			<div className={css.form}>
				<TextField.Root isInvalid={!!error}>
					<TextField.LabelText>
						<Trans>Handle or DID</Trans>
					</TextField.LabelText>
					<div className={css.field}>
						<span className={css.fieldIcon}>
							<AtIcon size="md" fill="currentColor" />
						</span>
						<TextField.Input
							autoCapitalize="none"
							className={css.fieldInput}
							label={l`Handle or DID`}
							onChangeText={setIdentifier}
							onKeyDown={onKeyDown}
							placeholder={l`e.g. alice.bsky.social`}
							value={identifier}
						/>
					</div>

					{error && (
						<Text className={css.error} color="textContrastMedium" size="sm">
							{error}
						</Text>
					)}
				</TextField.Root>

				<Button
					color="primary"
					disabled={isSubmitting}
					label={l`Sign in`}
					onClick={() => void onSubmit()}
					size="large"
					variant="solid"
				>
					{isSubmitting ? (
						<ButtonIcon icon={Loader} />
					) : (
						<ButtonText>
							<Trans>Sign in</Trans>
						</ButtonText>
					)}
				</Button>
				{onBack && (
					<Button
						color="secondary"
						disabled={isSubmitting}
						label={l`Back to your accounts`}
						onClick={onBack}
						size="large"
						variant="ghost"
					>
						<ButtonIcon icon={ChevronLeftIcon} />
						<ButtonText>
							<Trans>Back to your accounts</Trans>
						</ButtonText>
					</Button>
				)}
			</div>
		</div>
	);
}
