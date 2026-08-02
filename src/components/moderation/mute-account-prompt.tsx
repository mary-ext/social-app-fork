import * as Prompt from '#/components/Prompt';

import Bubble from '#/icons/central/Bubble2_round_outlined_radius1_stroke2.svg';
import Eye from '#/icons/central/EyeOpen_round_outlined_radius1_stroke2.svg';
import Megaphone from '#/icons/central/Megaphone_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';

/**
 * Mute/unmute confirmation. Muting shows an explainer of what the mute does; unmuting shows a plain
 * confirmation. `onConfirm` runs whichever action matches the current state.
 */
export function MuteAccountPrompt({
	handle,
	isMuted,
	onConfirm,
}: {
	handle: Prompt.PromptHandle;
	isMuted: boolean;
	onConfirm: () => void;
}) {
	if (isMuted) {
		return (
			<Prompt.Basic
				handle={handle}
				title={m['components.moderation.mute.unmuteTitle']()}
				description={m['components.moderation.mute.unmuteResume']()}
				onConfirm={onConfirm}
				confirmButtonCta={m['common.mute.action.unmute']()}
			/>
		);
	}

	return (
		<Prompt.Outer handle={handle} size="wide">
			<Prompt.Content>
				<Prompt.TitleText>{m['components.moderation.mute.confirmTitle']()}</Prompt.TitleText>
				<Prompt.DescriptionText>{m['components.moderation.whatHappens']()}</Prompt.DescriptionText>

				<Prompt.Rows>
					<Prompt.Row icon={Megaphone}>{m['components.moderation.mute.unaware']()}</Prompt.Row>
					<Prompt.Row icon={Eye}>{m['components.moderation.mute.seePostsNotReplies']()}</Prompt.Row>
					<Prompt.Row icon={Bubble}>{m['components.moderation.mute.replyNoNotif']()}</Prompt.Row>
				</Prompt.Rows>
			</Prompt.Content>
			<Prompt.Actions>
				<Prompt.Action onPress={onConfirm} cta={m['common.mute.action.mute']()} />
				<Prompt.Cancel />
			</Prompt.Actions>
		</Prompt.Outer>
	);
}
