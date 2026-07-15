import { useState } from 'react';

import type { ComAtprotoLabelDefs } from '@atcute/atproto';

import { useConstant } from '#/lib/hooks/use-constant';
import { useLabelInfo } from '#/lib/moderation/useLabelInfo';
import { makeProfileLink } from '#/lib/routes/links';

import { useSession } from '#/state/session';

import { relativeMessageParts } from '#/locale/intl/timeAgo';
import { Trans } from '#/locale/Trans';

import * as Dialog from '#/components/Dialog';
import { AppealForm } from '#/components/moderation/AppealForm';
import { Stack } from '#/components/Stack';
import { Text } from '#/components/Text';
import { Button, ButtonText } from '#/components/web/Button';
import { InlineLinkText } from '#/components/web/Link';

import { m } from '#/paraglide/messages';

import * as styles from './LabelsOnMeDialog.css';

export interface LabelsOnMeDialogProps {
	handle: Dialog.DialogHandle;
	labels: ComAtprotoLabelDefs.Label[];
	type: 'account' | 'content';
}

export function LabelsOnMeDialog(props: LabelsOnMeDialogProps) {
	return (
		<Dialog.Root handle={props.handle}>
			<Dialog.Popup size="wide">
				<LabelsOnMeDialogInner {...props} />
			</Dialog.Popup>
		</Dialog.Root>
	);
}

function LabelsOnMeDialogInner({ handle, labels, type }: LabelsOnMeDialogProps) {
	const { currentAccount } = useSession();
	const [appealingLabel, setAppealingLabel] = useState<ComAtprotoLabelDefs.Label | undefined>(undefined);
	const isAccount = type === 'account';
	const containsSelfLabel = labels.some((label) => label.src === currentAccount?.did);

	if (appealingLabel) {
		return (
			<AppealForm handle={handle} label={appealingLabel} onPressBack={() => setAppealingLabel(undefined)} />
		);
	}

	return (
		<Stack gap="lg">
			<Stack gap="xs">
				<Dialog.TitleRow>
					<Dialog.Title>
						{isAccount
							? m['components.moderation.label.titleAccount']()
							: m['components.moderation.label.titleContent']()}
					</Dialog.Title>
					<Dialog.Close />
				</Dialog.TitleRow>
				<Text color="textContrastMedium">
					{containsSelfLabel
						? m['components.moderation.appeal.nonSelfHint']()
						: m['components.moderation.appeal.theseLabelsHint']()}
				</Text>
			</Stack>

			<Stack gap="md">
				{labels.map((label) => (
					<Label
						key={`${label.val}-${label.src}`}
						handle={handle}
						isSelfLabel={label.src === currentAccount?.did}
						label={label}
						onPressAppeal={setAppealingLabel}
					/>
				))}
			</Stack>
		</Stack>
	);
}

function Label({
	handle,
	isSelfLabel,
	label,
	onPressAppeal,
}: {
	handle: Dialog.DialogHandle;
	isSelfLabel: boolean;
	label: ComAtprotoLabelDefs.Label;
	onPressAppeal: (label: ComAtprotoLabelDefs.Label) => void;
}) {
	const { labeler, strings } = useLabelInfo(label);
	const sourceName = labeler ? `@${labeler.creator.handle}` : label.src;
	const now = useConstant(Date.now);

	return (
		<div className={styles.card}>
			<div className={styles.cardTop}>
				<div className={styles.cardInfo}>
					<Text size="md" weight="semiBold">
						{strings.name}
					</Text>
					<Text color="textContrastMedium">{strings.description}</Text>
				</div>
				{!isSelfLabel && (
					<Button
						color="secondary"
						label={m['components.moderation.appeal.action']()}
						onClick={() => onPressAppeal(label)}
						size="small"
						variant="solid"
					>
						<ButtonText>{m['components.moderation.appeal.action']()}</ButtonText>
					</Button>
				)}
			</div>

			<Dialog.Divider />

			<div className={styles.band}>
				{isSelfLabel ? (
					<Text color="textContrastMedium">{m['components.moderation.label.appliedByYou']()}</Text>
				) : (
					<div className={styles.sourceRow}>
						<Text className={styles.sourceText} color="textContrastMedium" numberOfLines={1}>
							<Trans
								message={m['common.moderation.source']}
								inputs={{ source: sourceName }}
								markup={{
									t0: ({ children }) => (
										<InlineLinkText
											label={sourceName}
											onPress={() => handle.close()}
											to={makeProfileLink(labeler ? labeler.creator : { did: label.src })}
										>
											{children}
										</InlineLinkText>
									),
								}}
							/>
						</Text>
						{label.exp && (
							<Text className={styles.expires} color="textContrastMedium" size="sm">
								{m['common.mutedWord.expires'](relativeMessageParts(label.exp, now))}
							</Text>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
