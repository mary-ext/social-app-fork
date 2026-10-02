import { useState } from 'react';

import { MAX_DRAFT_GRAPHEME_LENGTH } from '#/lib/constants/composer';

import * as Prompt from '#/components/Prompt';

import { type Composer, useComposer } from '../context';
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
				draftSaveBlocker: getDraftSaveBlocker(composer.wg.state.doc),
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
 * @param props.onDiscard continues without saving
 * @returns the prompt
 */
export function DiscardPrompt({
	handle,
	draftSaveBlocker,
	isDraft,
	onDiscard,
}: DiscardGuard['prompt'] & {
	onDiscard: () => void;
}) {
	const { replyUri } = useComposer();

	// the draft format has no reply parent.
	if (replyUri !== null) {
		return (
			<Prompt.Basic
				handle={handle}
				title={`Discard draft?`}
				confirmButtonCta={`Discard`}
				confirmButtonColor="negative"
				onConfirm={onDiscard}
			/>
		);
	}

	let title: string;
	let message: string | undefined;
	switch (draftSaveBlocker) {
		case 'tooLong': {
			title = isDraft ? `Discard changes?` : `Discard post?`;
			message = `Drafts can have up to ${MAX_DRAFT_GRAPHEME_LENGTH} characters per post.`;
			break;
		}
		case 'voiceClip': {
			title = isDraft ? `Discard changes?` : `Discard post?`;
			break;
		}
		case undefined: {
			title = isDraft ? `Update draft?` : `Save draft?`;
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
					// TODO: save the thread as a draft.
					<Prompt.Action cta={isDraft ? `Update draft` : `Save draft`} color="primary" onPress={() => {}} />
				)}
				<Prompt.Action cta={`Discard`} color="negative_subtle" onPress={onDiscard} />
				<Prompt.Cancel cta={`Keep editing`} />
			</Prompt.Actions>
		</Prompt.Outer>
	);
}
