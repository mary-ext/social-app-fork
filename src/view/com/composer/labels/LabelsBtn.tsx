import { Trans, useLingui } from '@lingui/react/macro';

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

export function LabelsBtn({ labels, onChange }: { labels: SelfLabel[]; onChange: (v: SelfLabel[]) => void }) {
	const control = Dialog.useDialogHandle();
	const { t: l } = useLingui();

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
					<Button color="secondary" size="small" label={l`Content warnings`}>
						<ButtonIcon icon={hasLabel ? Check : Shield_Stroke2_Corner0_Rounded} />
						<ButtonText>{hasLabel ? <Trans>Labels added</Trans> : <Trans>Labels</Trans>}</ButtonText>
						<ButtonIcon icon={TinyChevronIcon} size="2xs" />
					</Button>
				}
			/>
			<Dialog.Root handle={control}>
				<Dialog.Popup label={l`Add a content warning`} size="narrow">
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
	const { t: l } = useLingui();

	const hasAdultLabel = labels.includes('sexual') || labels.includes('nudity') || labels.includes('porn');

	return (
		<>
			<div className={styles.header}>
				<Text size="_2xl" weight="semiBold">
					<Trans>Add a content warning</Trans>
				</Text>
				<Text color="textContrastMedium">
					<Trans>
						Please add any content warning labels that are applicable for the media you are posting.
					</Trans>
				</Text>
			</div>

			<div className={styles.sections}>
				<div className={styles.section}>
					<Text size="lg" weight="semiBold">
						<Trans>Adult Content</Trans>
					</Text>
					<Toggle.Group
						label={l`Adult Content labels`}
						onChange={(values) => updateAdultLabels(values as AdultSelfLabel[])}
						values={labels}
					>
						<Toggle.PanelGroup>
							<Toggle.Item label={l`Suggestive`} name="sexual">
								<Toggle.Panel adjacent="trailing">
									<Toggle.CheckboxIndicator />
									<Toggle.PanelText>
										<Trans>Suggestive</Trans>
									</Toggle.PanelText>
								</Toggle.Panel>
							</Toggle.Item>
							<Toggle.Item label={l`Nudity`} name="nudity">
								<Toggle.Panel adjacent="both">
									<Toggle.CheckboxIndicator />
									<Toggle.PanelText>
										<Trans>Nudity</Trans>
									</Toggle.PanelText>
								</Toggle.Panel>
							</Toggle.Item>
							<Toggle.Item label={l`Porn`} name="porn">
								<Toggle.Panel adjacent="leading">
									<Toggle.CheckboxIndicator />
									<Toggle.PanelText>
										<Trans>Adult</Trans>
									</Toggle.PanelText>
								</Toggle.Panel>
							</Toggle.Item>
						</Toggle.PanelGroup>
					</Toggle.Group>
					{hasAdultLabel && (
						<Text color="textContrastMedium">
							{labels.includes('sexual') ? (
								<Trans>Pictures meant for adults.</Trans>
							) : labels.includes('nudity') ? (
								<Trans>Artistic or non-erotic nudity.</Trans>
							) : (
								<Trans>Sexual activity or erotic nudity.</Trans>
							)}
						</Text>
					)}
				</div>

				<div className={styles.section}>
					<Text size="lg" weight="semiBold">
						<Trans>Other</Trans>
					</Text>
					<Toggle.Group
						label={l`Other labels`}
						onChange={(values) => updateOtherLabels(values as OtherSelfLabel[])}
						values={labels}
					>
						<Toggle.PanelGroup>
							<Toggle.Item label={l`Graphic Media`} name="graphic-media">
								<Toggle.Panel adjacent="none">
									<Toggle.CheckboxIndicator />
									<Toggle.PanelText>
										<Trans>Graphic Media</Trans>
									</Toggle.PanelText>
								</Toggle.Panel>
							</Toggle.Item>
						</Toggle.PanelGroup>
					</Toggle.Group>
					{labels.includes('graphic-media') && (
						<Text color="textContrastMedium">
							<Trans>Media that may be disturbing or inappropriate for some audiences.</Trans>
						</Text>
					)}
				</div>
			</div>

			<div className={styles.doneRow}>
				<Button color="primary" label={l`Done`} onClick={onDone} size="small">
					<ButtonText>
						<Trans>Done</Trans>
					</ButtonText>
				</Button>
			</div>
		</>
	);
}
