import { useEffect } from 'react';

import { usePrefetchProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { AppLanguageDropdown } from '#/components/AppLanguageDropdown';
import { signinDialogHandle } from '#/components/dialogs/handles';
import { SigninDialog } from '#/components/dialogs/Signin';
import { ErrorBoundary } from '#/components/ErrorBoundary';
import { Text } from '#/components/Text';
import { Button, ButtonText } from '#/components/web/Button';

import Logotype from '#/icons/brands/BlueskyLogotype.svg';
import LogoSky from '#/icons/brands/BlueskySky.svg';
import { m } from '#/paraglide/messages';

import * as css from './LoggedOut.css';

export function LoggedOut() {
	const { accounts } = useSession();
	const prefetchProfileQuery = usePrefetchProfileQuery();
	useEffect(() => {
		// warm each account's profile so the switcher renders instantly; the batched fetch coalesces
		// these into one getProfiles request.
		for (const acc of accounts) {
			void prefetchProfileQuery(acc.did);
		}
	}, [accounts, prefetchProfileQuery]);

	return (
		<div className={css.container}>
			<div className={css.content}>
				<ErrorBoundary>
					<div className={css.brand}>
						<LogoSky className={css.logo} />

						<div className={css.logotypeWrap}>
							<Logotype className={css.logotype} />
						</div>

						<Text color="textContrastMedium" size="md" weight="semiBold">
							{m['common.compose.placeholder']()}
						</Text>
					</div>

					<div className={css.actions}>
						<Button
							color="primary"
							label={m['common.session.action.signIn']()}
							onClick={() => signinDialogHandle.openWithPayload({})}
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
