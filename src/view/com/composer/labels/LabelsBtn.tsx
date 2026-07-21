import { unique } from '@mary/array-fns';

import { ADULT_CONTENT_LABELS, OTHER_SELF_LABELS, type SelfLabel } from '#/lib/moderation';

import * as Dialog from '#/components/Dialog';
import * as Toggle from '#/components/forms/Toggle';
import { Check_Stroke2_Corner0_Rounded as Check } from '#/components/icons/Check';
import { TinyChevronBottom_Stroke2_Corner0_Rounded as TinyChevronIcon } from '#/components/icons/Chevron';
import { Shield_Stroke2_Corner0_Rounded } from '#/components/icons/Shield';
import { Stack } from '#/components/Stack';
import { Text } from '#/components/Text';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

export function LabelsBtn({ labels, onChange }: { labels: SelfLabel[]; onChange: (v: SelfLabel[]) => void }) {
	const handle = Dialog.useDialogHandle();

	const hasLabel = labels.length > 0;

	// the toggle group hands back plain strings; the trailing predicate keeps only known self labels
	const updateAdultLabels = (newLabels: string[]) => {
		const newLabel = newLabels[newLabels.length - 1];
		const filtered = labels.filter((l) => !ADULT_CONTENT_LABELS.some((adult) => adult === l));
		onChange(unique([...filtered, newLabel]).filter((label): label is SelfLabel => Boolean(label)));
	};

	const updateOtherLabels = (newLabels: string[]) => {
		const newLabel = newLabels[newLabels.length - 1];
		const filtered = labels.filter((l) => !OTHER_SELF_LABELS.some((other) => other === l));
		onChange(unique([...filtered, newLabel]).filter((label): label is SelfLabel => Boolean(label)));
	};

	return (
		<>
			<Dialog.Trigger
				handle={handle}
				render={
					<Button color="secondary" size="small" label={m['view.composer.contentWarning.title']()}>
						<ButtonIcon icon={hasLabel ? Check : Shield_Stroke2_Corner0_Rounded} />
						<ButtonText>
							{hasLabel ? m['view.composer.contentWarning.labelsAdded']() : m['common.moderation.labels']()}
						</ButtonText>
						<ButtonIcon icon={TinyChevronIcon} size="2xs" />
					</Button>
				}
			/>

			<Dialog.Root handle={handle}>
				<Dialog.Popup size="narrow">
					<DialogInner
						labels={labels}
						updateAdultLabels={updateAdultLabels}
						updateOtherLabels={updateOtherLabels}
						onDone={() => handle.close()}
					/>
				</Dialog.Popup>
			</Dialog.Root>
		</>
	);
}

function DialogInner({
	labels,
	onDone,
	updateAdultLabels,
	updateOtherLabels,
}: {
	labels: string[];
	onDone: () => void;
	updateAdultLabels: (labels: string[]) => void;
	updateOtherLabels: (labels: string[]) => void;
}) {
	const hasAdultLabel = labels.includes('sexual') || labels.includes('nudity') || labels.includes('porn');

	return (
		<Stack gap="xl">
			<Stack gap="xs">
				<Dialog.TitleRow>
					<Dialog.Title>{m['view.composer.contentWarning.add']()}</Dialog.Title>
					<Dialog.Close />
				</Dialog.TitleRow>

				<Text color="textContrastMedium">{m['view.composer.contentWarning.hint']()}</Text>
			</Stack>

			<Stack gap="lg">
				<Stack gap="sm">
					<Text size="lg" weight="semiBold">
						{m['common.moderation.adultContent']()}
					</Text>
					<Toggle.Group
						label={m['view.composer.contentWarning.adultLabels']()}
						onChange={updateAdultLabels}
						values={labels}
					>
						<Toggle.PanelGroup>
							<Toggle.Item label={m['view.composer.contentWarning.suggestive']()} name="sexual">
								<Toggle.Panel adjacent="trailing">
									<Toggle.CheckboxIndicator />
									<Toggle.PanelText>{m['view.composer.contentWarning.suggestive']()}</Toggle.PanelText>
								</Toggle.Panel>
							</Toggle.Item>
							<Toggle.Item label={m['view.composer.contentWarning.nudity']()} name="nudity">
								<Toggle.Panel adjacent="both">
									<Toggle.CheckboxIndicator />
									<Toggle.PanelText>{m['view.composer.contentWarning.nudity']()}</Toggle.PanelText>
								</Toggle.Panel>
							</Toggle.Item>
							<Toggle.Item label={m['view.composer.contentWarning.porn']()} name="porn">
								<Toggle.Panel adjacent="leading">
									<Toggle.CheckboxIndicator />
									<Toggle.PanelText>{m['view.composer.contentWarning.adult']()}</Toggle.PanelText>
								</Toggle.Panel>
							</Toggle.Item>
						</Toggle.PanelGroup>
					</Toggle.Group>
					{hasAdultLabel && (
						<Text color="textContrastMedium">
							{labels.includes('sexual')
								? m['view.composer.contentWarning.pornDesc']()
								: labels.includes('nudity')
									? m['view.composer.contentWarning.nudityDesc']()
									: m['view.composer.contentWarning.sexualContentDesc']()}
						</Text>
					)}
				</Stack>

				<Stack gap="sm">
					<Text size="lg" weight="semiBold">
						{m['common.status.other']()}
					</Text>
					<Toggle.Group
						label={m['view.composer.contentWarning.otherLabels']()}
						onChange={updateOtherLabels}
						values={labels}
					>
						<Toggle.PanelGroup>
							<Toggle.Item label={m['common.moderation.graphicMedia']()} name="graphic-media">
								<Toggle.Panel adjacent="none">
									<Toggle.CheckboxIndicator />
									<Toggle.PanelText>{m['common.moderation.graphicMedia']()}</Toggle.PanelText>
								</Toggle.Panel>
							</Toggle.Item>
						</Toggle.PanelGroup>
					</Toggle.Group>
					{labels.includes('graphic-media') && (
						<Text color="textContrastMedium">{m['view.composer.contentWarning.disturbingDesc']()}</Text>
					)}
				</Stack>
			</Stack>

			<Dialog.Actions>
				<Button color="primary" label={m['common.action.done']()} onClick={onDone} size="small">
					<ButtonText>{m['common.action.done']()}</ButtonText>
				</Button>
			</Dialog.Actions>
		</Stack>
	);
}
