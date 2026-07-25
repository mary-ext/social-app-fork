import { AppLanguageDropdown } from '#/components/AppLanguageDropdown';
import { useGlobalDialogsHandleContext } from '#/components/dialogs/Context';
import { Logo } from '#/components/icons/Logo';
import { Text } from '#/components/Text';
import { Button, ButtonText } from '#/components/web/Button';
import { Link } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

import * as styles from './NavSignInCard.css';

/** Card shown in the left navigation sidebar and drawer when the user is signed out. */
export function NavSignInCard(): React.ReactNode {
	const { signinDialogHandle } = useGlobalDialogsHandleContext();

	const showSignIn = () => {
		signinDialogHandle.openWithPayload({});
	};

	return (
		<div className={styles.root}>
			<Link label="Bluesky - Home" to={{ name: 'Home' }}>
				<Logo width={32} />
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
					onClick={showSignIn}
					size="small"
					variant="solid"
				>
					<ButtonText>{m['common.session.action.signIn']()}</ButtonText>
				</Button>
			</div>
			<div className={styles.languageWrap}>
				<AppLanguageDropdown />
			</div>
		</div>
	);
}
