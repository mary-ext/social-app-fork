import { MAX_DRAFT_GRAPHEME_LENGTH } from '#/lib/constants/composer';

import type { DraftSaveBlocker } from '#/features/composer/drafts/state/api';

import * as Prompt from '#/components/Prompt';

/**
 * prompts before closing an unsaved thread.
 *
 * @param props.handle opens the prompt
 * @param props.isReply omits saving for replies
 * @param props.draftSaveBlocker reason saving is unavailable, or undefined to offer saving
 * @param props.onDiscard closes the composer
 * @returns the prompt
 */
export function DiscardPrompt({
	handle,
	isReply,
	draftSaveBlocker,
	onDiscard,
}: {
	handle: Prompt.PromptHandle;
	isReply: boolean;
	draftSaveBlocker: DraftSaveBlocker | undefined;
	onDiscard: () => void;
}) {
	if (isReply) {
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
			title = `Discard post?`;
			message = `Drafts can have up to ${MAX_DRAFT_GRAPHEME_LENGTH} characters per post.`;
			break;
		}
		case 'voiceClip': {
			title = `Discard post?`;
			break;
		}
		case undefined: {
			title = `Save draft?`;
			message = `Save this draft to edit later.`;
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
					<Prompt.Action cta={`Save draft`} color="primary" onPress={() => {}} />
				)}
				<Prompt.Action cta={`Discard`} color="negative_subtle" onPress={onDiscard} />
				<Prompt.Cancel cta={`Keep editing`} />
			</Prompt.Actions>
		</Prompt.Outer>
	);
}
