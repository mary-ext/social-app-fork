import { Bubble_Stroke2_Corner2_Rounded as Bubble } from '#/components/icons/Bubble';
import { Eye_Stroke2_Corner0_Rounded as Eye } from '#/components/icons/Eye';
import { Megaphone_Stroke2_Corner0_Rounded as Megaphone } from '#/components/icons/Megaphone';
import * as Prompt from '#/components/Prompt';

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
				title={m['components.moderation.block.unblockTitle']()}
				description={m['common.block.unblockHint']()}
				onConfirm={onConfirm}
				confirmButtonCta={m['common.block.action.unblock']()}
			/>
		);
	}

	return (
		<Prompt.Outer handle={handle} size="wide">
			<Prompt.Content>
				<Prompt.TitleText>{m['components.moderation.block.confirmTitle']()}</Prompt.TitleText>
				<Prompt.DescriptionText>{m['components.moderation.whatHappens']()}</Prompt.DescriptionText>

				<Prompt.Rows>
					<Prompt.Row icon={Megaphone}>{m['components.moderation.block.canSee']()}</Prompt.Row>
					<Prompt.Row icon={Eye}>{m['components.moderation.block.noSeePosts']()}</Prompt.Row>
					<Prompt.Row icon={Bubble}>{m['components.moderation.block.noMention']()}</Prompt.Row>
				</Prompt.Rows>

				{isLabeler && (
					<Prompt.DescriptionText>
						{m['components.moderation.block.descriptionLabeler']()}
					</Prompt.DescriptionText>
				)}
			</Prompt.Content>
			<Prompt.Actions>
				<Prompt.Action onPress={onConfirm} color="negative" cta={m['common.block.action.block']()} />
				<Prompt.Cancel />
			</Prompt.Actions>
		</Prompt.Outer>
	);
}
