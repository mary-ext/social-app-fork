import type { AppBskyActorDefs } from '@atcute/bluesky';

import { conversationTarget } from '#/lib/routes/targets';

import { useGetConvoAvailabilityQuery } from '#/state/queries/messages/get-convo-availability';
import { useGetConvoForMembers } from '#/state/queries/messages/get-convo-for-members';

import * as css from '#/components/dms/MessageProfileButton.css';
import { canBeMessaged } from '#/components/dms/util';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon } from '#/components/web/Button';

import Message from '#/icons/central/BubbleAnnotation3_round_outlined_radius1_stroke2.svg';
import { m } from '#/paraglide/messages';
import { useRouter } from '#/router';

/** Round button that opens (or starts) a DM with the profile, when the viewer is allowed to message them. */
export function MessageProfileButton({ profile }: { profile: AppBskyActorDefs.ProfileViewDetailed }) {
	const router = useRouter();

	const { data: convoAvailability } = useGetConvoAvailabilityQuery(profile.did);
	const { mutate: initiateConvo } = useGetConvoForMembers({
		onError: () => {
			Toast.show(m['common.chat.error.create']());
		},
		onSuccess: ({ convo }) => {
			router.navigate({ to: conversationTarget(convo.id) });
		},
	});

	const onPress = () => {
		if (!convoAvailability?.canChat) {
			return;
		}
		if (convoAvailability.convo) {
			router.navigate({ to: conversationTarget(convoAvailability.convo.id) });
		} else {
			initiateConvo([profile.did]);
		}
	};

	if (!convoAvailability) {
		// pending state, sized to the button to avoid layout shift
		if (canBeMessaged(profile)) {
			return (
				<div aria-hidden className={css.loading}>
					<Message className={css.messageIcon} />
				</div>
			);
		}
		return null;
	}

	if (convoAvailability.canChat) {
		return (
			<Button
				color="secondary"
				label={m['components.dms.chat.action.message']({ handle: profile.handle })}
				onClick={onPress}
				shape="round"
				size="small"
				variant="solid"
			>
				<ButtonIcon icon={Message} size="md" />
			</Button>
		);
	}

	return null;
}
