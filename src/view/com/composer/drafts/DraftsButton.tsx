import { MAX_DRAFT_GRAPHEME_LENGTH } from '#/lib/constants';

import * as Dialog from '#/components/Dialog';
import * as Prompt from '#/components/Prompt';
import { Button, ButtonText } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

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
}: {
	onSelectDraft: (draft: DraftSummary) => void;
	onSaveDraft: () => Promise<{ success: boolean }>;
	onDiscard: () => void;
	isEmpty: boolean;
	isDirty: boolean;
	isEditingDraft: boolean;
	canSaveDraft: boolean;
}) {
	const draftsDialogHandle = Dialog.useDialogHandle();
	const savePromptHandle = Prompt.usePromptHandle();
	const { isPending: isSaving } = useSaveDraftMutation();

	const handlePress = () => {
		if (isEmpty || !isDirty) {
			// Composer is empty or has no unsaved changes, go directly to drafts list
			draftsDialogHandle.open(null);
		} else {
			// Composer has unsaved changes, ask what to do
			savePromptHandle.open(null);
		}
	};

	const handleSaveAndOpen = async () => {
		const { success } = await onSaveDraft();
		if (success) {
			draftsDialogHandle.open(null);
		}
	};

	const handleDiscardAndOpen = () => {
		onDiscard();
		draftsDialogHandle.open(null);
	};

	return (
		<>
			<Button
				label={m['view.composer.drafts.title']()}
				variant="ghost"
				color="primary"
				shape="default"
				size="small"
				disabled={isSaving}
				onClick={handlePress}
			>
				<ButtonText size="md">{m['view.composer.drafts.title']()}</ButtonText>
			</Button>
			<DraftsListDialog handle={draftsDialogHandle} onSelectDraft={onSelectDraft} />
			<Prompt.Outer handle={savePromptHandle}>
				<Prompt.Content>
					<Prompt.TitleText>
						{canSaveDraft
							? isEditingDraft
								? m['view.composer.drafts.saveChanges.title']()
								: m['view.composer.drafts.save.title']()
							: m['view.composer.drafts.discard.title']()}
					</Prompt.TitleText>
					<Prompt.DescriptionText>
						{canSaveDraft
							? isEditingDraft
								? m['view.composer.drafts.beforeViewing.unsaved']()
								: m['view.composer.drafts.beforeViewing.save']()
							: m['view.composer.drafts.beforeViewing.tooLong']({ max: MAX_DRAFT_GRAPHEME_LENGTH })}
					</Prompt.DescriptionText>
				</Prompt.Content>
				<Prompt.Actions>
					{canSaveDraft && (
						<Prompt.Action
							cta={
								isEditingDraft ? m['common.action.saveChanges']() : m['view.composer.drafts.action.save']()
							}
							onPress={() => void handleSaveAndOpen()}
							color="primary"
						/>
					)}
					<Prompt.Action
						cta={m['common.action.discard']()}
						onPress={handleDiscardAndOpen}
						color="negative_subtle"
					/>
					<Prompt.Cancel cta={m['view.composer.discard.keepEditing']()} />
				</Prompt.Actions>
			</Prompt.Outer>
		</>
	);
}
