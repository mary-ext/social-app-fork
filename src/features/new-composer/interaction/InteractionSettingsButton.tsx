import * as Dialog from '#/components/Dialog';
import { DraftInteractionSettingsDialog } from '#/components/dialogs/PostInteractionSettingsDialog/DraftSettingsDialog';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import TinyChevronIcon from '#/icons/central/ChevronBottom_round_outlined_radius1_stroke2.svg';
import EarthIcon from '#/icons/central/Earth_round_outlined_radius1_stroke2.svg';
import GroupIcon from '#/icons/central/Group3_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

import { useComposer } from '../context';
import { useInteractionSettings } from './settings';

/**
 * reply and quote settings for the thread.
 *
 * @returns the settings button and dialog
 */
export function InteractionSettingsButton() {
	const { interaction } = useComposer();
	const settings = useInteractionSettings();
	const handle = Dialog.useDialogHandle();

	const anyoneCanInteract = settings.replies.type === 'anyone' && settings.allowQuotes;
	const label = anyoneCanInteract
		? m['view.composer.interaction.anyone']()
		: m['view.composer.interaction.limited']();

	return (
		<>
			<Dialog.Trigger
				handle={handle}
				render={
					<Button color="secondary" size="small" label={label}>
						<ButtonIcon icon={anyoneCanInteract ? EarthIcon : GroupIcon} />
						<ButtonText>{label}</ButtonText>
						<ButtonIcon icon={TinyChevronIcon} size="_2xs" />
					</Button>
				}
			/>
			<DraftInteractionSettingsDialog handle={handle} onSave={interaction.set} value={settings} />
		</>
	);
}
