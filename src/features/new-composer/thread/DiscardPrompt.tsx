import { useState } from 'react';

import {
	MAX_DRAFT_CAPTION_SIZE,
	MAX_DRAFT_GRAPHEME_LENGTH,
	MAX_DRAFT_IMAGES,
} from '#/lib/constants/composer';

import * as Prompt from '#/components/Prompt';
import * as Toast from '#/components/Toast';

import { type Composer, useComposer, useThreadInteraction } from '../context';
import { useSaveDraftMutation } from '../drafts/queries';
import { type DraftSaveBlocker, getDraftSaveBlocker } from '../drafts/save-blocker';

/** unsaved-changes guard and its prompt props. */
export type DiscardGuard = {
	/**
	 * opens the prompt if the thread has unsaved changes.
	 *
	 * @returns true if prompted; false if the caller can proceed
	 */
	intercept: () => boolean;
	prompt: {
		handle: Prompt.PromptHandle;
		draftSaveBlocker: DraftSaveBlocker | undefined;
		isDraft: boolean;
	};
};

/**
 * guards an action that would lose the thread's unsaved changes.
 *
 * @param composer the composer to guard
 * @returns the guard and its prompt props
 */
export const useDiscardGuard = (composer: Composer): DiscardGuard => {
	const handle = Prompt.usePromptHandle();
	// keep prompt text stable during the exit animation when discarding replaces the composer.
	const [snapshot, setSnapshot] = useState<{
		draftSaveBlocker: DraftSaveBlocker | undefined;
		isDraft: boolean;
	}>({ draftSaveBlocker: undefined, isDraft: false });

	return {
		intercept() {
			if (!composer.hasUnsavedChanges()) {
				return false;
			}

			setSnapshot({
				draftSaveBlocker: getDraftSaveBlocker(composer.wg.state),
				isDraft: composer.draft !== null,
			});
			handle.open(null);
			return true;
		},
		prompt: { handle, ...snapshot },
	};
};

/**
 * prompts before closing or replacing an unsaved thread.
 *
 * @param props.handle opens the prompt
 * @param props.draftSaveBlocker reason saving is unavailable, or undefined to offer saving
 * @param props.isDraft whether the thread came from a saved draft
 * @param props.onProceed continues once the thread is saved or discarded
 * @returns the prompt
 */
export function DiscardPrompt({
	handle,
	draftSaveBlocker,
	isDraft,
	onProceed,
}: DiscardGuard['prompt'] & {
	onProceed: () => void;
}) {
	const composer = useComposer();
	const interaction = useThreadInteraction();
	const { mutate: saveDraft, isPending: isSaving } = useSaveDraftMutation();

	// the draft format has no reply parent.
	if (composer.replyUri !== null) {
		return (
			<Prompt.Basic
				handle={handle}
				title={`Discard draft?`}
				confirmButtonCta={`Discard`}
				confirmButtonColor="negative"
				onConfirm={onProceed}
			/>
		);
	}

	const save = () => {
		saveDraft(
			{ composer, interaction },
			{
				onSuccess() {
					handle.close();
					Toast.show(isDraft ? `Draft updated` : `Draft saved`);
					onProceed();
				},
				onError(err) {
					console.error('failed to save draft', err);
					Toast.show(`Couldn't save this draft`, { type: 'error' });
				},
			},
		);
	};

	let title: string;
	if (draftSaveBlocker === undefined) {
		title = isDraft ? `Update draft?` : `Save draft?`;
	} else {
		title = isDraft ? `Discard changes?` : `Discard post?`;
	}

	let message: string | undefined;
	switch (draftSaveBlocker) {
		case 'captionTooLarge': {
			message = `Drafts can have caption files up to ${MAX_DRAFT_CAPTION_SIZE / 1000} KB.`;
			break;
		}
		case 'tooLong': {
			message = `Drafts can have up to ${MAX_DRAFT_GRAPHEME_LENGTH} characters per post.`;
			break;
		}
		case 'tooManyMedia': {
			message = `Drafts can have up to ${MAX_DRAFT_IMAGES} images and one video or GIF per post.`;
			break;
		}
		case 'voiceClip': {
			break;
		}
		case undefined: {
			message = isDraft ? `Save your changes to this draft.` : `Save this draft to edit later.`;
			break;
		}
	}

	return (
		<Prompt.Outer handle={handle}>
			<Prompt.Content>
				<Prompt.TitleText>{title}</Prompt.TitleText>
				{message && <Prompt.DescriptionText>{message}</Prompt.DescriptionText>}
			</Prompt.Content>
			<Prompt.Actions>
				{draftSaveBlocker === undefined && (
					<Prompt.Action
						cta={isDraft ? `Update draft` : `Save draft`}
						color="primary"
						disabled={isSaving}
						shouldCloseOnPress={false}
						onPress={save}
					/>
				)}
				<Prompt.Action cta={`Discard`} color="negative_subtle" disabled={isSaving} onPress={onProceed} />
				<Prompt.Cancel cta={`Keep editing`} />
			</Prompt.Actions>
		</Prompt.Outer>
	);
}
