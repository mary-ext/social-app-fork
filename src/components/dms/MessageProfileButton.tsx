import { useCallback } from 'react';
import type { AppBskyActorDefs } from '@atcute/bluesky';
import { useNavigation } from '@react-navigation/native';

import type { NavigationProp } from '#/lib/routes/types';

import { useGetConvoAvailabilityQuery } from '#/state/queries/messages/get-convo-availability';
import { useGetConvoForMembers } from '#/state/queries/messages/get-convo-for-members';

import * as css from '#/components/dms/MessageProfileButton.css';
import { canBeMessaged } from '#/components/dms/util';
import { Message_Stroke2_Corner0_Rounded as Message } from '#/components/icons/Message';
import * as Toast from '#/components/Toast';
import { Button, ButtonIcon } from '#/components/web/Button';

import { m } from '#/paraglide/messages';

/** Round button that opens (or starts) a DM with the profile, when the viewer is allowed to message them. */
export function MessageProfileButton({ profile }: { profile: AppBskyActorDefs.ProfileViewDetailed }) {
	const navigation = useNavigation<NavigationProp>();

	const { data: convoAvailability } = useGetConvoAvailabilityQuery(profile.did);
	const { mutate: initiateConvo } = useGetConvoForMembers({
		onError: () => {
			Toast.show(m['common.error.createConversation']());
		},
		onSuccess: ({ convo }) => {
			navigation.navigate('MessagesConversation', { conversation: convo.id });
		},
	});

	const onPress = useCallback(() => {
		if (!convoAvailability?.canChat) {
			return;
		}
		if (convoAvailability.convo) {
			navigation.navigate('MessagesConversation', { conversation: convoAvailability.convo.id });
		} else {
			initiateConvo([profile.did]);
		}
	}, [navigation, profile.did, initiateConvo, convoAvailability]);

	if (!convoAvailability) {
		// pending state, sized to the button to avoid layout shift
		if (canBeMessaged(profile)) {
			return (
				<div aria-hidden className={css.loading}>
					<Message width={20} height={20} fill="currentColor" />
				</div>
			);
		}
		return null;
	}

	if (convoAvailability.canChat) {
		return (
			<Button
				color="secondary"
				label={m['components.dms.action.messageUser']({ handle: profile.handle })}
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
