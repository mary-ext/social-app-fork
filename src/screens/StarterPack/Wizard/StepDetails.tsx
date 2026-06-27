import { useId } from 'react';
import { Trans, useLingui } from '@lingui/react/macro';

import { useProfileQuery } from '#/state/queries/profile';
import { useSession } from '#/state/session';

import { useWizardState } from '#/screens/StarterPack/Wizard/State';

import { StarterPack } from '#/components/icons/StarterPack';
import { Text } from '#/components/Text';
import * as TextField from '#/components/TextField';

import * as css from './Wizard.css';

const NAME_MAX_LENGTH = 50;

export function StepDetails() {
	const { t: l } = useLingui();
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
					<Trans>Invites, but personal</Trans>
				</Text>
				<Text size="md" align="center" className={css.detailsSubtitle}>
					<Trans>Invite your friends to follow your favorite feeds and people</Trans>
				</Text>
			</div>
			<TextField.Root>
				<TextField.LabelText
					accessory={
						<Text
							aria-label={l`${nameLength} of ${NAME_MAX_LENGTH} characters`}
							className={css.counter}
							color="textContrastMedium"
							id={counterId}
							size="sm"
						>
							{nameLength} / {NAME_MAX_LENGTH}
						</Text>
					}
				>
					<Trans>What do you want to call your starter pack?</Trans>
				</TextField.LabelText>
				<TextField.Input
					describedBy={counterId}
					label={name ? l`${name}'s starter pack` : l`My starter pack`}
					maxLength={NAME_MAX_LENGTH}
					onChangeText={(text) => dispatch({ type: 'SetName', name: text })}
					value={state.name ?? ''}
				/>
			</TextField.Root>
			<TextField.Root>
				<TextField.LabelText>
					<Trans>Tell us a little more</Trans>
				</TextField.LabelText>
				<TextField.Input
					label={
						name
							? l`${name}'s favorite feeds and people - join me!`
							: l`My favorite feeds and people - join me!`
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
