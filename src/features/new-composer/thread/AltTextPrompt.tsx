import * as Prompt from '#/components/Prompt';

import { useComposer } from '../context';
import { findMissingAlt } from '../media/shared/alt-text';

/** missing alt text guard and its prompt props. */
export type AltTextGuard = {
	/**
	 * opens the prompt if any attachment lacks alt text.
	 *
	 * @returns true if prompted; false if the caller can proceed
	 */
	intercept: () => boolean;
	prompt: {
		handle: Prompt.PromptHandle;
	};
};

/**
 * reminds about missing alt text before publishing.
 *
 * @returns the guard and its prompt props
 */
export const useAltTextGuard = (): AltTextGuard => {
	const { wg } = useComposer();
	const handle = Prompt.usePromptHandle();

	return {
		intercept() {
			if (findMissingAlt(wg.state) === undefined) {
				return false;
			}

			handle.open(null);
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
	const { wg, altRequests } = useComposer();

	const addAlt = () => {
		// the prompt is modal, so the thread can't change while it's open.
		const mediaId = findMissingAlt(wg.state);
		if (mediaId !== undefined) {
			altRequests.emit(mediaId);
		}
	};

	return (
		<Prompt.Outer handle={handle}>
			<Prompt.Content>
				<Prompt.TitleText>{`Don't forget to make your media accessible`}</Prompt.TitleText>
				<Prompt.DescriptionText>{`Alt text describes your uploaded media for low-vision users and provides additional context for everyone.`}</Prompt.DescriptionText>
			</Prompt.Content>
			<Prompt.Actions>
				<Prompt.Action cta={`Add alt text`} color="primary" onPress={addAlt} />
				<Prompt.Action cta={`Post anyway`} color="secondary" onPress={onProceed} />
			</Prompt.Actions>
		</Prompt.Outer>
	);
}
