import { useEffect } from 'react';

import { usePrefetchProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { ErrorBoundary } from '#/view/com/util/ErrorBoundary';
import { Logo } from '#/view/icons/Logo';
import { Logotype } from '#/view/icons/Logotype';

import { AppLanguageDropdown } from '#/components/AppLanguageDropdown';
import { useGlobalDialogsHandleContext } from '#/components/dialogs/Context';
import { SigninDialog } from '#/components/dialogs/Signin';
import { Text } from '#/components/Text';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';
import { colors } from '#/styles/colors';

import * as css from './LoggedOut.css';

export function LoggedOut() {
	const { signinDialogHandle } = useGlobalDialogsHandleContext();

	const { accounts } = useSession();
	const prefetchProfileQuery = usePrefetchProfileQuery();
	useEffect(() => {
		// warm each account's profile so the switcher renders instantly; the batched fetch coalesces
		// these into one getProfiles request.
		for (const acc of accounts) {
			void prefetchProfileQuery(acc.did);
		}
	}, [accounts, prefetchProfileQuery]);

	const showSignIn = () => {
		signinDialogHandle.openWithPayload({});
	};

	return (
		<div className={css.container}>
			<div className={css.content}>
				<ErrorBoundary>
					<div className={css.brand}>
						<Logo fill="sky" width={92} />

						<div className={css.logotypeWrap}>
							<Logotype fill={colors.text} width={161} />
						</div>

						<Text color="textContrastMedium" size="md" weight="semiBold">
							{m['common.compose.placeholder']()}
						</Text>
					</div>

					<div className={css.actions}>
						<Button
							color="primary"
							label={m['common.session.action.signIn']()}
							onClick={showSignIn}
							size="large"
							variant="solid"
						>
							<ButtonText>{m['common.session.action.signIn']()}</ButtonText>
						</Button>
					</div>
				</ErrorBoundary>
			</div>

			<div className={css.footer}>
				<div className={css.footerSpacer} />
				<AppLanguageDropdown />
			</div>

			<SigninDialog />
		</div>
	);
}
