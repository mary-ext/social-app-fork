import {
	ADULT_CONTENT_LABELS,
	type AdultSelfLabel,
	OTHER_SELF_LABELS,
	type OtherSelfLabel,
	type SelfLabel,
} from '#/lib/moderation';

import * as styles from '#/view/com/composer/labels/LabelsBtn.css';

import { Check_Stroke2_Corner0_Rounded as Check } from '#/components/icons/Check';
import { TinyChevronBottom_Stroke2_Corner0_Rounded as TinyChevronIcon } from '#/components/icons/Chevron';
import { Shield_Stroke2_Corner0_Rounded } from '#/components/icons/Shield';
import { Text } from '#/components/Text';
import { Button, ButtonIcon, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import * as Toggle from '#/components/web/forms/Toggle';

import { m } from '#/paraglide/messages';

export function LabelsBtn({ labels, onChange }: { labels: SelfLabel[]; onChange: (v: SelfLabel[]) => void }) {
	const control = Dialog.useDialogHandle();

	const hasLabel = labels.length > 0;

	const updateAdultLabels = (newLabels: AdultSelfLabel[]) => {
		const newLabel = newLabels[newLabels.length - 1];
		const filtered = labels.filter((l) => !ADULT_CONTENT_LABELS.includes(l as AdultSelfLabel));
		onChange([...new Set([...filtered, newLabel])].filter((label): label is SelfLabel => Boolean(label)));
	};

	const updateOtherLabels = (newLabels: OtherSelfLabel[]) => {
		const newLabel = newLabels[newLabels.length - 1];
		const filtered = labels.filter((l) => !OTHER_SELF_LABELS.includes(l as OtherSelfLabel));
		onChange([...new Set([...filtered, newLabel])].filter((label): label is SelfLabel => Boolean(label)));
	};

	return (
		<>
			<Dialog.Trigger
				handle={control}
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
			<Dialog.Root handle={control}>
				<Dialog.Popup label={m['view.composer.contentWarning.add']()} size="narrow">
					<Dialog.Close />
					<DialogInner
						labels={labels}
						updateAdultLabels={updateAdultLabels}
						updateOtherLabels={updateOtherLabels}
						onDone={() => control.close()}
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
	updateAdultLabels: (labels: AdultSelfLabel[]) => void;
	updateOtherLabels: (labels: OtherSelfLabel[]) => void;
}) {
	const hasAdultLabel = labels.includes('sexual') || labels.includes('nudity') || labels.includes('porn');

	return (
		<>
			<div className={styles.header}>
				<Text size="_2xl" weight="semiBold">
					{m['view.composer.contentWarning.add']()}
				</Text>
				<Text color="textContrastMedium">{m['view.composer.contentWarning.hint']()}</Text>
			</div>

			<div className={styles.sections}>
				<div className={styles.section}>
					<Text size="lg" weight="semiBold">
						{m['common.moderation.adultContent']()}
					</Text>
					<Toggle.Group
						label={m['view.composer.contentWarning.adultLabels']()}
						onChange={(values) => updateAdultLabels(values as AdultSelfLabel[])}
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
				</div>

				<div className={styles.section}>
					<Text size="lg" weight="semiBold">
						{m['common.status.other']()}
					</Text>
					<Toggle.Group
						label={m['view.composer.contentWarning.otherLabels']()}
						onChange={(values) => updateOtherLabels(values as OtherSelfLabel[])}
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
				</div>
			</div>

			<div className={styles.doneRow}>
				<Button color="primary" label={m['common.action.done']()} onClick={onDone} size="small">
					<ButtonText>{m['common.action.done']()}</ButtonText>
				</Button>
			</div>
		</>
	);
}
