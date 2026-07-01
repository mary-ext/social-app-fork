import type { ChatBskyGroupDefs } from '@atcute/bluesky';
import { ClientResponseError } from '@atcute/client';

import { isNetworkError } from '#/lib/strings/errors';

import { useWithdrawJoinGroupChatRequest } from '#/state/queries/messages/withdraw-join-group-chat';

import { TimeElapsed } from '#/view/com/util/TimeElapsed';

import { AvatarBubbles } from '#/components/AvatarBubbles';
import { Text } from '#/components/Text';
import * as Toast from '#/components/Toast';
import * as Prompt from '#/components/web/Prompt';

import { m } from '#/paraglide/messages';

import * as css from './OutgoingRequestListItem.css';

export function OutgoingRequestListItem({
	convo: convoView,
}: {
	convo: ChatBskyGroupDefs.JoinRequestConvoView;
}) {
	const prompt = Prompt.usePromptHandle();

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
			<button
				type="button"
				className={css.row}
				aria-label={m['screens.messages.requests.rescind.action']()}
				onClick={() => prompt.open(null)}
			>
				<AvatarBubbles profiles={[convoView.owner]} count={convoView.memberCount} size={48} />

				<div className={css.body}>
					<div className={css.nameRow}>
						<Text className={css.name} size="md" weight="semiBold" numberOfLines={1}>
							{convoView.name}
						</Text>

						{convoView.viewer?.requestedAt ? (
							<TimeElapsed timestamp={convoView.viewer.requestedAt}>
								{({ timeElapsed }) => (
									<Text className={css.timestamp} size="md" color="textContrastMedium" numberOfLines={1}>
										{timeElapsed}
									</Text>
								)}
							</TimeElapsed>
						) : null}
					</div>

					<Text size="md_sub" color="textContrastMedium" numberOfLines={1}>
						{m['screens.messages.requests.requested']()}
					</Text>
				</div>
			</button>

			<Prompt.Basic
				handle={prompt}
				title={m['common.requests.action.rescind']()}
				description={m['screens.messages.requests.rescind.confirm']({ name: convoView.name })}
				confirmButtonCta={m['common.requests.action.rescind']()}
				onConfirm={() => {
					if (isWithdrawPending) return;
					withdrawRequest({ convoId: convoView.convoId });
				}}
			/>
		</>
	);
}
