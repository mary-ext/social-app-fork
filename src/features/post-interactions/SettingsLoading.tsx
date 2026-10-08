import { CenteredSpinner } from '#/components/CenteredSpinner';
import * as Dialog from '#/components/Dialog';

import { m } from '#/paraglide/messages';

export function SettingsLoading() {
	return (
		<>
			<Dialog.Header.Root>
				<Dialog.Header.Close />
				<Dialog.Header.Title>{m['components.dialogs.interaction.title']()}</Dialog.Header.Title>
			</Dialog.Header.Root>
			<Dialog.Body>
				<CenteredSpinner label={m['components.dialogs.interaction.loading']()} />
			</Dialog.Body>
		</>
	);
}
