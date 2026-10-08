import { useState } from 'react';

import { CheckboxGroup } from '@base-ui/react/checkbox-group';

import {
	type AdultContentLabel,
	isAdultContentLabel,
	OTHER_SELF_LABELS,
	type SelfLabel,
} from '#/lib/moderation/self-labels';

import * as Dialog from '#/components/Dialog';
import * as Radio from '#/components/primitives/radio';
import * as Settings from '#/components/Settings';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

const NO_ADULT_LABEL = 'none';

type Option = {
	value: AdultContentLabel | typeof NO_ADULT_LABEL;
	label: () => string;
	description: (() => string) | null;
};

const ADULT_OPTIONS: readonly Option[] = [
	{
		value: NO_ADULT_LABEL,
		label: m['features.composer.labels.none'],
		description: null,
	},
	{
		value: 'sexual',
		label: m['features.composer.labels.suggestive'],
		description: m['features.composer.labels.suggestiveDesc'],
	},
	{
		value: 'nudity',
		label: m['features.composer.labels.nudity'],
		description: m['features.composer.labels.nudityDesc'],
	},
	{
		value: 'porn',
		label: m['features.composer.labels.porn'],
		description: m['features.composer.labels.pornDesc'],
	},
];

type Draft = { adult: AdultContentLabel | null; others: SelfLabel[] };

/**
 * content warning form. remount to reset unsaved changes.
 *
 * @param props.labels labels when the dialog opened
 * @param props.onSave receives replacement labels
 * @returns the form
 */
export const LabelsDialogBody = ({
	labels,
	onSave,
}: {
	labels: readonly SelfLabel[];
	onSave: (labels: SelfLabel[]) => void;
}) => {
	const [draft, setDraft] = useState<Draft>(() => ({
		adult: labels.find(isAdultContentLabel) ?? null,
		others: labels.filter((label) => !isAdultContentLabel(label)),
	}));

	return (
		<>
			<Dialog.Header.Root border="scrolling">
				<Dialog.Header.Close />
				<Dialog.Header.Title>{m['features.composer.labels.title']()}</Dialog.Header.Title>
				<Dialog.Header.Actions>
					<Button
						color="primary"
						size="small"
						label={m['common.action.save']()}
						onClick={() => onSave(draft.adult ? [draft.adult, ...draft.others] : draft.others)}
					>
						<ButtonText>{m['common.action.save']()}</ButtonText>
					</Button>
				</Dialog.Header.Actions>
			</Dialog.Header.Root>
			<Dialog.Body>
				<Settings.List surface="flush">
					<Settings.Section
						titleText={m['common.moderation.adultContent']()}
						bodyText={m['features.composer.labels.hint']()}
					>
						<Radio.Group
							aria-label={m['features.composer.labels.adultLabels']()}
							value={draft.adult ?? NO_ADULT_LABEL}
							onValueChange={(value) => {
								setDraft({ ...draft, adult: isAdultContentLabel(value) ? value : null });
							}}
						>
							{ADULT_OPTIONS.map((option) => (
								<Settings.RadioRow key={option.value} label={option.label()} value={option.value}>
									<Settings.Label titleText={option.label()} subtitleText={option.description?.()} />
								</Settings.RadioRow>
							))}
						</Radio.Group>
					</Settings.Section>

					<Settings.Section titleText={m['common.status.other']()}>
						<CheckboxGroup
							aria-label={m['features.composer.labels.otherLabels']()}
							value={draft.others}
							onValueChange={(values) => {
								setDraft({ ...draft, others: OTHER_SELF_LABELS.filter((label) => values.includes(label)) });
							}}
						>
							<Settings.CheckboxRow label={m['common.moderation.graphicMedia']()} value="graphic-media">
								<Settings.Label
									titleText={m['common.moderation.graphicMedia']()}
									subtitleText={m['features.composer.labels.graphicMediaDesc']()}
								/>
							</Settings.CheckboxRow>
						</CheckboxGroup>
					</Settings.Section>
				</Settings.List>
			</Dialog.Body>
		</>
	);
};
