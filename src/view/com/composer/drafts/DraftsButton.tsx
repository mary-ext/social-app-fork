import { Button, ButtonText } from '#/components/web/Button';
import * as Dialog from '#/components/web/Dialog';
import * as Prompt from '#/components/web/Prompt';

import { m } from '#/paraglide/messages';

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
				label={m['view.composer.title.drafts']()}
				variant="ghost"
				color="primary"
				shape="default"
				size="small"
				className={styles.trigger}
				disabled={isSaving}
				onClick={handlePress}
			>
				<ButtonText size="md">{m['view.composer.title.drafts']()}</ButtonText>
			</Button>
			<DraftsListDialog handle={draftsDialogControl} onSelectDraft={onSelectDraft} />
			<Prompt.Outer handle={savePromptControl}>
				<Prompt.Content>
					<Prompt.TitleText>
						{canSaveDraft
							? isEditingDraft
								? m['view.composer.dialog.saveChangesTitle']()
								: m['view.composer.dialog.saveDraftTitle']()
							: m['view.composer.dialog.discardDraftTitle']()}
					</Prompt.TitleText>
					<Prompt.DescriptionText>
						{canSaveDraft
							? isEditingDraft
								? m['view.composer.dialog.unsavedSaveBeforeViewing']()
								: m['view.composer.dialog.saveDraftBeforeViewing']()
							: m['view.composer.dialog.draftTooLongDiscard']()}
					</Prompt.DescriptionText>
				</Prompt.Content>
				<Prompt.Actions>
					{canSaveDraft && (
						<Prompt.Action
							cta={isEditingDraft ? m['common.action.saveChanges']() : m['view.composer.action.saveDraft']()}
							onPress={() => void handleSaveAndOpen()}
							color="primary"
						/>
					)}
					<Prompt.Action
						cta={m['common.action.discard']()}
						onPress={handleDiscardAndOpen}
						color="negative_subtle"
					/>
					<Prompt.Cancel cta={m['view.composer.action.keepEditing']()} />
				</Prompt.Actions>
			</Prompt.Outer>
		</>
	);
}
