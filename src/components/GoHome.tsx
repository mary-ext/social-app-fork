import { ButtonText } from '#/components/web/Button';
import { LinkButton } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

/**
 * renders a button that navigates to the home screen.
 *
 * @returns a home navigation button
 */
export function GoHome() {
	return (
		<LinkButton
			color="secondary"
			label={m['common.action.goHome']()}
			size="small"
			to={{ name: 'Home' }}
			variant="solid"
		>
			<ButtonText>{m['common.action.goHome']()}</ButtonText>
		</LinkButton>
	);
}
