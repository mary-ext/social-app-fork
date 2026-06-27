import { Bubble_Stroke2_Corner2_Rounded as Bubble } from '#/components/icons/Bubble';
import { Eye_Stroke2_Corner0_Rounded as Eye } from '#/components/icons/Eye';
import { Megaphone_Stroke2_Corner0_Rounded as Megaphone } from '#/components/icons/Megaphone';
import * as Prompt from '#/components/web/Prompt';

import { m } from '#/paraglide/messages';

/**
 * Block/unblock confirmation. Blocking shows an explainer of what the block does; unblocking shows a plain
 * confirmation. `onConfirm` runs whichever action matches the current state.
 */
export function BlockAccountPrompt({
	handle,
	isBlocking,
	isLabeler,
	onConfirm,
}: {
	handle: Prompt.PromptHandle;
	isBlocking: boolean;
	isLabeler: boolean;
	onConfirm: () => void;
}) {
	if (isBlocking) {
		return (
			<Prompt.Basic
				handle={handle}
				title={m['components.moderation.dialog.unblockTitle']()}
				description={m['common.hint.unblockInteract']()}
				onConfirm={onConfirm}
				confirmButtonCta={m['common.action.unblock']()}
			/>
		);
	}

	return (
		<Prompt.Outer handle={handle} size="wide">
			<Prompt.Content>
				<Prompt.TitleText>{m['components.moderation.block.confirmTitle']()}</Prompt.TitleText>
				<Prompt.DescriptionText>{m['components.moderation.hint.whatHappens']()}</Prompt.DescriptionText>

				<Prompt.Rows>
					<Prompt.Row icon={Megaphone}>{m['components.moderation.hint.blockedCanSee']()}</Prompt.Row>
					<Prompt.Row icon={Eye}>{m['components.moderation.hint.blockedNoSeePosts']()}</Prompt.Row>
					<Prompt.Row icon={Bubble}>{m['components.moderation.hint.blockedNoMention']()}</Prompt.Row>
				</Prompt.Rows>

				{isLabeler && (
					<Prompt.DescriptionText>
						{m['components.moderation.block.descriptionLabeler']()}
					</Prompt.DescriptionText>
				)}
			</Prompt.Content>
			<Prompt.Actions>
				<Prompt.Action onPress={onConfirm} color="negative" cta={m['common.action.block']()} />
				<Prompt.Cancel />
			</Prompt.Actions>
		</Prompt.Outer>
	);
}
