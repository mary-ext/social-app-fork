import { Trans, useLingui } from '@lingui/react/macro';

import { Bubble_Stroke2_Corner2_Rounded as Bubble } from '#/components/icons/Bubble';
import { Eye_Stroke2_Corner0_Rounded as Eye } from '#/components/icons/Eye';
import { Megaphone_Stroke2_Corner0_Rounded as Megaphone } from '#/components/icons/Megaphone';
import * as Prompt from '#/components/web/Prompt';

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
	const { t: l } = useLingui();

	if (isBlocking) {
		return (
			<Prompt.Basic
				handle={handle}
				title={l`Unblock account?`}
				description={l`The account will be able to interact with you after unblocking.`}
				onConfirm={onConfirm}
				confirmButtonCta={l`Unblock`}
			/>
		);
	}

	return (
		<Prompt.Outer handle={handle} size="wide">
			<Prompt.Content>
				<Prompt.TitleText>{l`Block account?`}</Prompt.TitleText>
				<Prompt.DescriptionText>{l`Here's what happens if you do:`}</Prompt.DescriptionText>

				<Prompt.Rows>
					<Prompt.Row icon={Megaphone}>
						<Trans>They can see they're blocked</Trans>
					</Prompt.Row>
					<Prompt.Row icon={Eye}>
						<Trans>They can't see your posts and you won't see theirs or any replies to them</Trans>
					</Prompt.Row>
					<Prompt.Row icon={Bubble}>
						<Trans>They can't mention you or reply to your posts</Trans>
					</Prompt.Row>
				</Prompt.Rows>

				{isLabeler && (
					<Prompt.DescriptionText>
						{l`Blocking won't stop this labeler's labels from being applied to your account.`}
					</Prompt.DescriptionText>
				)}
			</Prompt.Content>
			<Prompt.Actions>
				<Prompt.Action onPress={onConfirm} color="negative" cta={l`Block`} />
				<Prompt.Cancel />
			</Prompt.Actions>
		</Prompt.Outer>
	);
}
