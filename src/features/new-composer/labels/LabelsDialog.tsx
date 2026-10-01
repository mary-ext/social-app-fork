import { useState } from 'react';

import { CheckboxGroup } from '@base-ui/react/checkbox-group';
import { RadioGroup } from '@base-ui/react/radio-group';

import {
	type AdultContentLabel,
	isAdultContentLabel,
	OTHER_SELF_LABELS,
	type SelfLabel,
} from '#/lib/moderation/self-labels';

import * as Dialog from '#/components/Dialog';
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
		label: m['view.composer.contentWarning.none'],
		description: null,
	},
	{
		value: 'sexual',
		label: m['view.composer.contentWarning.suggestive'],
		description: m['view.composer.contentWarning.pornDesc'],
	},
	{
		value: 'nudity',
		label: m['view.composer.contentWarning.nudity'],
		description: m['view.composer.contentWarning.nudityDesc'],
	},
	{
		value: 'porn',
		label: m['view.composer.contentWarning.porn'],
		description: m['view.composer.contentWarning.sexualContentDesc'],
	},
];

type Draft = { adult: AdultContentLabel | null; others: SelfLabel[] };

/** current labels supplied in the dialog's opening payload. */
export type LabelsTarget = {
	labels: readonly SelfLabel[];
};

/**
 * edits content warnings; dismissing without saving discards changes.
 *
 * @param props.handle the dialog's handle
 * @param props.onSave receives replacement labels and the original opening payload
 * @returns the dialog
 */
export const LabelsDialog = <T extends LabelsTarget>({
	handle,
	onSave,
}: {
	handle: Dialog.DialogHandle<T>;
	onSave: (labels: SelfLabel[], target: T) => void;
}) => {
	return (
		<Dialog.Root handle={handle}>
			{({ payload }) => (
				<Dialog.Popup scroll="body" size="medium">
					{payload && (
						<LabelsForm
							labels={payload.labels}
							onSave={(next) => {
								onSave(next, payload);
								handle.close();
							}}
						/>
					)}
				</Dialog.Popup>
			)}
		</Dialog.Root>
	);
};

// remount on each opening to reset unsaved changes.
const LabelsForm = ({
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
				<Dialog.Header.Title>{m['view.composer.contentWarning.title']()}</Dialog.Header.Title>
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
						bodyText={m['view.composer.contentWarning.hint']()}
					>
						<RadioGroup
							aria-label={m['view.composer.contentWarning.adultLabels']()}
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
						</RadioGroup>
					</Settings.Section>

					<Settings.Section titleText={m['common.status.other']()}>
						<CheckboxGroup
							aria-label={m['view.composer.contentWarning.otherLabels']()}
							value={draft.others}
							onValueChange={(values) => {
								setDraft({ ...draft, others: OTHER_SELF_LABELS.filter((label) => values.includes(label)) });
							}}
						>
							<Settings.CheckboxRow label={m['common.moderation.graphicMedia']()} value="graphic-media">
								<Settings.Label
									titleText={m['common.moderation.graphicMedia']()}
									subtitleText={m['view.composer.contentWarning.disturbingDesc']()}
								/>
							</Settings.CheckboxRow>
						</CheckboxGroup>
					</Settings.Section>
				</Settings.List>
			</Dialog.Body>
		</>
	);
};
