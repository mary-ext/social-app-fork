import { lazy, type ReactNode, Suspense } from 'react';

import { signinDialogHandle } from '#/components/dialogs/handles';
import { Text } from '#/components/Text';
import { Button, ButtonText } from '#/components/web/Button';
import { Link } from '#/components/web/Link';

import Logo from '#/icons/brands/Bluesky.svg';
import { m } from '#/paraglide/messages';

import * as styles from './NavSignInCard.css';

// keep the select control off the signed-in navigation path.
const AppLanguageDropdown = lazy(() =>
	import('#/components/AppLanguageDropdown').then((mod) => ({ default: mod.AppLanguageDropdown })),
);

/** Card shown in the left navigation sidebar and drawer when the user is signed out. */
export function NavSignInCard(): ReactNode {
	return (
		<div className={styles.root}>
			<Link label="Bluesky - Home" to={{ name: 'Home' }}>
				<Logo className={styles.logo} />
			</Link>
			<div className={styles.titleWrap}>
				<Text leading="none" size="_3xl" weight="bold">
					{m['view.auth.signIn.prompt']()}
				</Text>
			</div>
			<div className={styles.buttonRow}>
				<Button
					color="primary"
					label={m['common.session.action.signIn']()}
					onClick={() => signinDialogHandle.openWithPayload({})}
					size="small"
					variant="solid"
				>
					<ButtonText>{m['common.session.action.signIn']()}</ButtonText>
				</Button>
			</div>
			<div className={styles.languageWrap}>
				<Suspense fallback={null}>
					<AppLanguageDropdown />
				</Suspense>
			</div>
		</div>
	);
}
