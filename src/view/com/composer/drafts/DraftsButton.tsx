import { useLingui, Trans } from '@lingui/react/macro';

import { Button, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import * as Prompt from '#/components/web/Prompt';

import * as styles from './DraftsButton.css';
import { DraftsListDialog } from './DraftsListDialog';
import { useSaveDraftMutation } from './state/queries';
import type { DraftSummary } from './state/schema';

export function DraftsButton({
	onSelectDraft,
	onSaveDraft,
	onDiscard,
	isEmpty,
	isDirty,
	isEditingDraft,
	canSaveDraft,
	textLength: _textLength,
}: {
	onSelectDraft: (draft: DraftSummary) => void;
	onSaveDraft: () => Promise<{ success: boolean }>;
	onDiscard: () => void;
	isEmpty: boolean;
	isDirty: boolean;
	isEditingDraft: boolean;
	canSaveDraft: boolean;
	textLength: number;
}) {
	const { t: l } = useLingui();
	const draftsDialogControl = Dialog.useDialogHandle();
	const savePromptControl = Prompt.usePromptHandle();
	const { isPending: isSaving } = useSaveDraftMutation();

	const handlePress = () => {
		if (isEmpty || !isDirty) {
			// Composer is empty or has no unsaved changes, go directly to drafts list
			draftsDialogControl.open(null);
		} else {
			// Composer has unsaved changes, ask what to do
			savePromptControl.open(null);
		}
	};

	const handleSaveAndOpen = async () => {
		const { success } = await onSaveDraft();
		if (success) {
			draftsDialogControl.open(null);
		}
	};

	const handleDiscardAndOpen = () => {
		onDiscard();
		draftsDialogControl.open(null);
	};

	return (
		<>
			<Button
				label={l`Drafts`}
				variant="ghost"
				color="primary"
				shape="default"
				size="small"
				className={styles.trigger}
				disabled={isSaving}
				onClick={handlePress}
			>
				<ButtonText size="md">
					<Trans>Drafts</Trans>
				</ButtonText>
			</Button>
			<DraftsListDialog handle={draftsDialogControl} onSelectDraft={onSelectDraft} />
			<Prompt.Outer handle={savePromptControl}>
				<Prompt.Content>
					<Prompt.TitleText>
						{canSaveDraft ? (
							isEditingDraft ? (
								<Trans>Save changes?</Trans>
							) : (
								<Trans>Save draft?</Trans>
							)
						) : (
							<Trans>Discard draft?</Trans>
						)}
					</Prompt.TitleText>
					<Prompt.DescriptionText>
						{canSaveDraft ? (
							isEditingDraft ? (
								<Trans>
									You have unsaved changes. Would you like to save them before viewing your drafts?
								</Trans>
							) : (
								<Trans>Would you like to save this as a draft before viewing your drafts?</Trans>
							)
						) : (
							<Trans>
								You can only save drafts up to 1000 characters. Would you like to discard this post before
								viewing your drafts?
							</Trans>
						)}
					</Prompt.DescriptionText>
				</Prompt.Content>
				<Prompt.Actions>
					{canSaveDraft && (
						<Prompt.Action
							cta={isEditingDraft ? l`Save changes` : l`Save draft`}
							onPress={() => void handleSaveAndOpen()}
							color="primary"
						/>
					)}
					<Prompt.Action cta={l`Discard`} onPress={handleDiscardAndOpen} color="negative_subtle" />
					<Prompt.Cancel cta={l`Keep editing`} />
				</Prompt.Actions>
			</Prompt.Outer>
		</>
	);
}
