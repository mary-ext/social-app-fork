import { useId } from 'react';

import { useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { useWizardState } from '#/screens/StarterPack/Wizard/State';

import { StarterPack } from '#/components/icons/StarterPack';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';

import { m } from '#/paraglide/messages';

import * as css from './Wizard.css';

const NAME_MAX_LENGTH = 50;

export function StepDetails() {
	const [state, dispatch] = useWizardState();
	const counterId = useId();

	const { currentAccount } = useSession();
	const { data: currentProfile } = useProfileQuery({
		did: currentAccount?.did,
		staleTime: Infinity,
	});

	const name = currentProfile?.displayName || currentProfile?.handle;
	const nameLength = state.name?.length ?? 0;

	return (
		<>
			<div className={css.detailsHeader}>
				<StarterPack width={90} gradient="sky" />
				<Text weight="semiBold" size="_3xl">
					{m['screens.starterPack.tagline']()}
				</Text>
				<Text size="md" align="center" className={css.detailsSubtitle}>
					{m['screens.starterPack.inviteDescription']()}
				</Text>
			</div>
			<TextField.Root>
				<TextField.LabelText
					accessory={
						<Text
							aria-label={m['screens.starterPack.charCount']({ nameLength, NAME_MAX_LENGTH })}
							className={css.counter}
							color="textContrastMedium"
							id={counterId}
							size="sm"
						>
							{nameLength} / {NAME_MAX_LENGTH}
						</Text>
					}
				>
					{m['screens.starterPack.title.namePrompt']()}
				</TextField.LabelText>
				<TextField.Input
					describedBy={counterId}
					label={
						name
							? m['screens.starterPack.defaultNameNamed']({ name })
							: m['screens.starterPack.defaultName']()
					}
					maxLength={NAME_MAX_LENGTH}
					onChangeText={(text) => dispatch({ type: 'SetName', name: text })}
					value={state.name ?? ''}
				/>
			</TextField.Root>
			<TextField.Root>
				<TextField.LabelText>{m['screens.starterPack.title.tellMore']()}</TextField.LabelText>
				<TextField.Input
					label={
						name
							? m['screens.starterPack.shareDescriptionNamed']({ name })
							: m['screens.starterPack.shareDescription']()
					}
					minRows={6}
					multiline
					onChangeText={(text) => dispatch({ type: 'SetDescription', description: text })}
					value={state.description ?? ''}
				/>
			</TextField.Root>
		</>
	);
}
