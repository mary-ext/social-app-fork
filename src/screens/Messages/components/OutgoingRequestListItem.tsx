import { View } from 'react-native';
import type { ChatBskyGroupDefs } from '@atcute/bluesky';
import { ClientResponseError } from '@atcute/client';

import { isNetworkError } from '#/lib/strings/errors';

import { useWithdrawJoinGroupChatRequest } from '#/state/queries/messages/withdraw-join-group-chat';

import { TimeElapsed } from '#/view/com/util/TimeElapsed';

import { atoms as a, useTheme } from '#/alf';

import { AvatarBubbles } from '#/components/AvatarBubbles';
import { createStaticClick, Link } from '#/components/Link';
import * as Prompt from '#/components/Prompt';
import * as Toast from '#/components/Toast';
import { Text } from '#/components/Typography';

import { m } from '#/paraglide/messages';

export function OutgoingRequestListItem({
	convo: convoView,
}: {
	convo: ChatBskyGroupDefs.JoinRequestConvoView;
}) {
	const t = useTheme();
	const prompt = Prompt.usePromptControl();

	const { mutate: withdrawRequest, isPending: isWithdrawPending } = useWithdrawJoinGroupChatRequest({
		onSuccess: () => {
			Toast.show(m['common.requests.rescinded']());
		},
		onError: (error) => {
			let errorMessage = m['common.requests.error.rescind']();
			if (isNetworkError(error)) {
				errorMessage = m['common.error.connection']();
			} else if (error instanceof ClientResponseError && error.error === 'InvalidJoinRequest') {
				errorMessage = m['common.requests.error.invalidRescind']();
			}
			Toast.show(errorMessage);
		},
	});

	return (
		<>
			<Link
				label={m['screens.messages.requests.rescind.action']()}
				{...createStaticClick(() => {
					prompt.open();
				})}
			>
				{({ hovered, pressed, focused }) => (
					<View
						style={[
							a.flex_row,
							a.align_center,
							a.flex_1,
							a.px_lg,
							a.py_md,
							a.gap_md,
							(hovered || pressed || focused) && t.atoms.bg_contrast_25,
						]}
					>
						<AvatarBubbles profiles={[convoView.owner]} count={convoView.memberCount} size={48} />
						<View style={[a.flex_1]}>
							<View style={[a.w_full, a.flex_row, a.align_center, a.gap_xs, a.pb_2xs]}>
								<View style={[a.flex_shrink]}>
									<Text numberOfLines={1} style={[a.text_md, a.font_semi_bold]}>
										{convoView.name}
									</Text>
								</View>
								{convoView.viewer?.requestedAt ? (
									<TimeElapsed timestamp={convoView.viewer.requestedAt}>
										{({ timeElapsed }) => (
											<Text numberOfLines={1} style={[a.text_sm, t.atoms.text_contrast_medium]}>
												{timeElapsed}
											</Text>
										)}
									</TimeElapsed>
								) : null}
							</View>
							<Text numberOfLines={1} style={[a.text_sm, t.atoms.text_contrast_high]}>
								{m['screens.messages.requests.requested']()}
							</Text>
						</View>
					</View>
				)}
			</Link>
			<Prompt.Basic
				control={prompt}
				title={m['common.requests.action.rescind']()}
				description={m['screens.messages.requests.rescind.confirm']({ name: convoView.name })}
				confirmButtonCta={m['common.requests.action.rescind']()}
				onConfirm={() => {
					prompt.close(() => {
						if (isWithdrawPending) return;
						withdrawRequest({ convoId: convoView.convoId });
					});
				}}
			/>
		</>
	);
}
