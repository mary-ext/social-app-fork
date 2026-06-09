import { Trans, useLingui } from '@lingui/react/macro';

import { Bubble_Stroke2_Corner2_Rounded as Bubble } from '#/components/icons/Bubble';
import { Eye_Stroke2_Corner0_Rounded as Eye } from '#/components/icons/Eye';
import { Megaphone_Stroke2_Corner0_Rounded as Megaphone } from '#/components/icons/Megaphone';
import * as Prompt from '#/components/web/Prompt';

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
	const { t: l } = useLingui();

	if (isMuted) {
		return (
			<Prompt.Basic
				handle={handle}
				title={l`Unmute account?`}
				description={l`You'll start seeing posts and replies from this account again.`}
				onConfirm={onConfirm}
				confirmButtonCta={l`Unmute`}
			/>
		);
	}

	return (
		<Prompt.Outer handle={handle} size="wide">
			<Prompt.Content>
				<Prompt.TitleText>{l`Mute account?`}</Prompt.TitleText>
				<Prompt.DescriptionText>{l`Here's what happens if you do:`}</Prompt.DescriptionText>

				<Prompt.Rows>
					<Prompt.Row icon={Megaphone}>
						<Trans>They won't know they've been muted</Trans>
					</Prompt.Row>
					<Prompt.Row icon={Eye}>
						<Trans>They can see your posts but you won't see theirs or any replies to them</Trans>
					</Prompt.Row>
					<Prompt.Row icon={Bubble}>
						<Trans>
							They can mention you and reply to your posts but you won't see any notifications from them
						</Trans>
					</Prompt.Row>
				</Prompt.Rows>
			</Prompt.Content>
			<Prompt.Actions>
				<Prompt.Action onPress={onConfirm} cta={l`Mute`} />
				<Prompt.Cancel />
			</Prompt.Actions>
		</Prompt.Outer>
	);
}
