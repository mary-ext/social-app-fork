import { useAltTextReminderEnabled } from '#/state/preferences/alt-text';

import { findMissingAlt } from '#/features/composer/media/alt-text';

import * as Prompt from '#/components/Prompt';

import { m } from '#/paraglide/messages';

import { useComposer } from '../context';
import { openAltText } from '../media/media-dialogs';
import { getMediaTileSelector } from '../shared/elements';

/** missing alt text guard and its prompt props. */
export type AltTextGuard = {
	/**
	 * opens the prompt if the reminder is enabled and any attachment lacks alt text.
	 *
	 * @returns true if prompted; false if the caller can proceed
	 */
	intercept: () => boolean;
	prompt: {
		handle: Prompt.PromptHandle;
	};
};

/**
 * creates the pre-publish alt text guard.
 *
 * @returns the guard and its prompt props
 */
export const useAltTextGuard = (): AltTextGuard => {
	const { wg } = useComposer();
	const handle = Prompt.usePromptHandle();
	const enabled = useAltTextReminderEnabled();

	return {
		intercept() {
			if (!enabled || findMissingAlt(wg.state) === undefined) {
				return false;
			}

			handle.open();
			return true;
		},
		prompt: { handle },
	};
};

/**
 * offers to add missing alt text or publish without it.
 *
 * @param props.handle opens the prompt
 * @param props.onProceed publishes as-is
 * @returns the prompt
 */
export function AltTextPrompt({
	handle,
	onProceed,
}: AltTextGuard['prompt'] & {
	onProceed: () => void;
}) {
	const composer = useComposer();

	const addAlt = () => {
		const missing = findMissingAlt(composer.wg.state);
		if (missing !== undefined) {
			// focus before opening so the dialog returns focus to the tile.
			document.querySelector<HTMLElement>(getMediaTileSelector(missing.item.id))?.focus();
			openAltText(composer, missing.postId, missing.item);
		}
	};

	return (
		<Prompt.Outer handle={handle}>
			<Prompt.Content>
				<Prompt.TitleText>{m['features.composer.altText.reminder.title']()}</Prompt.TitleText>
				<Prompt.DescriptionText>
					{m['features.composer.altText.reminder.description']()}
				</Prompt.DescriptionText>
			</Prompt.Content>
			<Prompt.Actions>
				<Prompt.Action cta={m['features.composer.altText.action.add']()} color="primary" onPress={addAlt} />
				<Prompt.Action
					cta={m['features.composer.publish.action.anyway']()}
					color="secondary"
					onPress={onProceed}
				/>
			</Prompt.Actions>
		</Prompt.Outer>
	);
}
