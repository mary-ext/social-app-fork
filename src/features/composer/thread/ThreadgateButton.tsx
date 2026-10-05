import type { InteractionSettings } from '#/lib/interaction-settings';

import * as Dialog from '#/components/Dialog';
import { DraftInteractionSettingsDialog } from '#/components/dialogs/PostInteractionSettingsDialog/DraftSettingsDialog';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import TinyChevronIcon from '#/icons/central/ChevronBottom_round_outlined_radius1_stroke2.svg';
import EarthIcon from '#/icons/central/Earth_round_outlined_radius1_stroke2.svg';
import GroupIcon from '#/icons/central/Group3_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

export function ThreadgateButton({
	value,
	disabled,
	onChange,
}: {
	value: InteractionSettings;
	disabled: boolean;
	onChange: (next: InteractionSettings) => void;
}) {
	const handle = Dialog.useDialogHandle();

	const anyoneCanInteract = value.replies.type === 'anyone' && value.allowQuotes;
	const label = anyoneCanInteract
		? m['features.composer.interaction.anyone']()
		: m['features.composer.interaction.limited']();

	return (
		<>
			<Dialog.Trigger
				handle={handle}
				render={
					<Button color="secondary" size="small" label={label} disabled={disabled}>
						<ButtonIcon icon={anyoneCanInteract ? EarthIcon : GroupIcon} />
						<ButtonText>{label}</ButtonText>
						<ButtonIcon icon={TinyChevronIcon} size="_2xs" />
					</Button>
				}
			/>
			<DraftInteractionSettingsDialog handle={handle} onSave={onChange} value={value} />
		</>
	);
}
