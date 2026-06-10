import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { Trans, useLingui } from '@lingui/react/macro';

import { type SessionAccount, useSession, useSessionApi } from '#/state/session';

import { logger } from '#/logger';

import { atoms as a, useBreakpoints, useTheme } from '#/alf';

import { AccountList } from '#/components/AccountList';
import { Button, ButtonIcon, ButtonText } from '#/components/Button';
import * as Dialog from '#/components/Dialog';
import { useGlobalDialogsControlContext } from '#/components/dialogs/Context';
import * as TextField from '#/components/forms/TextField';
import { At_Stroke2_Corner0_Rounded as AtIcon } from '#/components/icons/At';
import { ChevronLeft_Stroke2_Corner0_Rounded as ChevronLeftIcon } from '#/components/icons/Chevron';
import { Loader } from '#/components/Loader';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';

export function SigninDialog() {
	const { signinDialogControl } = useGlobalDialogsControlContext();
	return (
		<Dialog.Outer control={signinDialogControl.control} onClose={signinDialogControl.clear}>
			<Dialog.Handle />
			<SigninDialogInner />
		</Dialog.Outer>
	);
}

function SigninDialogInner() {
	const { t: l } = useLingui();
	const { gtMobile } = useBreakpoints();
	const { accounts } = useSession();
	const { signinDialogControl } = useGlobalDialogsControlContext();
	const payload = signinDialogControl.value;
	const requestedAccount = payload?.requestedAccount;
	const showStoredAccounts = payload?.showStoredAccounts ?? true;
	const hasStoredAccounts = showStoredAccounts && accounts.length > 0;

	// The dialog stays mounted between opens, so the entry screen is derived
	// rather than fixed: stored accounts get the chooser, everything else the
	// new-account form.
	const [screen, setScreen] = useState<'choose' | 'new'>(() =>
		hasStoredAccounts && !requestedAccount ? 'choose' : 'new',
	);
	useEffect(() => {
		setScreen(hasStoredAccounts && !requestedAccount ? 'choose' : 'new');
	}, [hasStoredAccounts, requestedAccount]);

	return (
		<Dialog.ScrollableInner
			label={l`Sign in to Bluesky`}
			style={[gtMobile ? { width: 'auto', maxWidth: 560 } : a.w_full]}
		>
			{screen === 'choose' ? (
				<ChooseAccountScreen onSelectOther={() => setScreen('new')} />
			) : (
				<NewAccountScreen
					initialHandle={requestedAccount?.handle ?? ''}
					onBack={hasStoredAccounts ? () => setScreen('choose') : undefined}
				/>
			)}
			<Dialog.Close />
		</Dialog.ScrollableInner>
	);
}

function ChooseAccountScreen({ onSelectOther }: { onSelectOther: () => void }) {
	const t = useTheme();
	const { t: l } = useLingui();
	const { currentAccount } = useSession();
	const { login, switchAccount } = useSessionApi();
	const { signinDialogControl } = useGlobalDialogsControlContext();
	const [pendingDid, setPendingDid] = useState<string | null>(null);

	const onSelectAccount = useCallback(
		async (account: SessionAccount) => {
			if (pendingDid) {
				return;
			}
			if (account.did === currentAccount?.did) {
				signinDialogControl.control.close();
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
		[currentAccount?.did, l, login, pendingDid, switchAccount, signinDialogControl.control],
	);

	return (
		<View style={[a.gap_2xl]}>
			<View style={[a.gap_sm]}>
				<Text style={[a.font_semi_bold, a.text_2xl]}>
					<Trans>Sign in</Trans>
				</Text>
				<Text style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high]}>
					<Trans>Choose an account to sign in with.</Trans>
				</Text>
			</View>
			<AccountList
				onSelectAccount={(account) => void onSelectAccount(account)}
				onSelectOther={onSelectOther}
				otherLabel={l`Sign in to another account`}
				pendingDid={pendingDid}
			/>
		</View>
	);
}

function NewAccountScreen({ initialHandle, onBack }: { initialHandle: string; onBack?: () => void }) {
	const t = useTheme();
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

	return (
		<View style={[a.gap_2xl]}>
			<View style={[a.gap_sm]}>
				<Text style={[a.font_semi_bold, a.text_2xl]}>
					<Trans>Sign in</Trans>
				</Text>
				<Text style={[a.text_md, a.leading_snug, t.atoms.text_contrast_high]}>
					<Trans>Sign in with your Bluesky account.</Trans>
				</Text>
			</View>
			<View style={[a.gap_md]}>
				<View>
					<TextField.LabelText>
						<Trans>Handle or DID</Trans>
					</TextField.LabelText>
					<TextField.Root isInvalid={!!error}>
						<TextField.Icon icon={AtIcon} />
						<Dialog.Input
							autoCapitalize="none"
							autoCorrect={false}
							editable={!isSubmitting}
							label={l`Handle or DID`}
							onChangeText={setIdentifier}
							onSubmitEditing={() => void onSubmit()}
							placeholder={l`e.g. alice.bsky.social`}
							value={identifier}
						/>
					</TextField.Root>
					{error && <Text style={[a.text_sm, a.pt_xs, t.atoms.text_contrast_medium]}>{error}</Text>}
				</View>
				<Button
					color="primary"
					disabled={isSubmitting}
					label={l`Sign in`}
					onPress={() => void onSubmit()}
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
						onPress={onBack}
						size="large"
						variant="ghost"
					>
						<ButtonIcon icon={ChevronLeftIcon} />
						<ButtonText>
							<Trans>Back to your accounts</Trans>
						</ButtonText>
					</Button>
				)}
			</View>
		</View>
	);
}
