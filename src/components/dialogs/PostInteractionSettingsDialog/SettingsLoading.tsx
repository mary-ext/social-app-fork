import { CenteredSpinner } from '#/components/CenteredSpinner';
import * as Dialog from '#/components/Dialog';

import { m } from '#/paraglide/messages';

export function SettingsLoading() {
	return (
		<>
			<Dialog.Close variant="floating" />
			<CenteredSpinner label={m['components.dialogs.interaction.loading']()} />
		</>
	);
}
