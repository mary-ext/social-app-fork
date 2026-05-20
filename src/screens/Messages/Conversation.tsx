import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { moderateProfile } from '@atproto/api';
import { useLingui } from '@lingui/react/macro';
import { type RouteProp, useFocusEffect, useIsFocused, useRoute } from '@react-navigation/native';
import { type NativeStackScreenProps } from '@react-navigation/native-stack';

import { useViewportZoomLock } from '#/lib/hooks/useViewportZoomLock';
import { type CommonNavigatorParams } from '#/lib/routes/types';

import { useMaybeProfileShadow } from '#/state/cache/profile-shadow';
import { ConvoProvider, isConvoActive, useConvo } from '#/state/messages/convo';
import { ConvoStatus } from '#/state/messages/convo/types';
import { useCurrentConvoId } from '#/state/messages/current-convo-id';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useConvoQuery } from '#/state/queries/messages/conversation';
import { useSession } from '#/state/session';

import { MessagesList } from '#/screens/Messages/components/MessagesList';

import { atoms as a, useTheme } from '#/alf';

import { MessagesListBlockedFooter } from '#/components/dms/MessagesListBlockedFooter';
import { MessagesListHeader } from '#/components/dms/MessagesListHeader';
import { type ConvoWithDetails, parseConvoView } from '#/components/dms/util';
import { Error } from '#/components/Error';
import * as Layout from '#/components/Layout';
import { Loader } from '#/components/Loader';

import { ScrollEdgeEffectProvider } from '#/shims/bsky-scroll-edge-effect';

import { ChatDisabled } from './components/ChatDisabled';
import { ChatEnded } from './components/ChatEnded';
import { ChatLocked } from './components/ChatLocked';

type Props = NativeStackScreenProps<CommonNavigatorParams, 'MessagesConversation'>;

export function MessagesConversationScreen(props: Props) {
	return <MessagesConversationScreenInner {...props} />;
}

export function MessagesConversationScreenInner({ route }: Props) {
	const convoId = route.params.conversation;
	const { setCurrentConvoId } = useCurrentConvoId();

	useFocusEffect(
		useCallback(() => {
			setCurrentConvoId(convoId);

			return () => {
				setCurrentConvoId(undefined);
			};
		}, [convoId, setCurrentConvoId]),
	);

	return (
		<Layout.Screen minimalShell testID="convoScreen" noInsetTop={false} style={[{ minHeight: 0 }, a.flex_1]}>
			<ScrollEdgeEffectProvider>
				<ConvoProvider key={convoId} convoId={convoId}>
					<Inner convoId={convoId} />
				</ConvoProvider>
			</ScrollEdgeEffectProvider>
		</Layout.Screen>
	);
}

function Inner({ convoId }: { convoId: string }) {
	const t = useTheme();
	const convoState = useConvo();
	const { t: l } = useLingui();
	const { currentAccount } = useSession();
	const isFocused = useIsFocused();
	const { data: convoData } = useConvoQuery({ convoId });

	useViewportZoomLock({ enabled: isFocused });

	const convo = convoData ? parseConvoView(convoData, currentAccount?.did) : null;

	// Because we want to give the list a chance to asynchronously scroll to the end before it is visible to the user,
	// we use `hasScrolled` to determine when to render. With that said however, there is a chance that the chat will be
	// empty. So, we also check for that possible state as well and render once we can.
	const [hasScrolled, setHasScrolled] = useState(false);
	const readyToShow =
		hasScrolled ||
		(isConvoActive(convoState) && !convoState.isFetchingHistory && convoState.items.length === 0);

	// Any time that we re-render the `Initializing` state, we have to reset `hasScrolled` to false. After entering this
	// state, we know that we're resetting the list of messages and need to re-scroll to the bottom when they get added.
	const [prevState, setPrevState] = useState(convoState.status);
	if (prevState !== convoState.status) {
		setPrevState(convoState.status);
		if (convoState.status === ConvoStatus.Initializing) {
			setHasScrolled(false);
		}
	}

	if (convoState.status === ConvoStatus.Error) {
		return (
			<>
				<Layout.Center style={[a.w_full]}>
					<MessagesListHeader convo={convo} />
				</Layout.Center>
				<Error
					title={l`Something went wrong`}
					message={l`We couldn't load this conversation`}
					onRetry={() => convoState.error.retry()}
					sideBorders={false}
				/>
			</>
		);
	}

	return (
		<Layout.Center style={[a.flex_1]}>
			{!readyToShow && (
				<View>
					<MessagesListHeader convo={convo} />
				</View>
			)}
			<View style={[a.flex_1]}>
				<InnerReady
					convo={convo}
					hasScrolled={hasScrolled}
					setHasScrolled={setHasScrolled}
					isActive={isConvoActive(convoState)}
					isDisabled={convoState.status === ConvoStatus.Disabled}
					hasMessages={isConvoActive(convoState) && convoState.items.length > 0}
				/>
				{!readyToShow && (
					<View
						style={[a.absolute, a.z_10, a.w_full, a.h_full, a.justify_center, a.align_center, t.atoms.bg]}
					>
						<View style={[{ marginBottom: 75 }]}>
							<Loader size="xl" />
						</View>
					</View>
				)}
			</View>
		</Layout.Center>
	);
}

function InnerReady({
	hasScrolled,
	setHasScrolled,
	convo,
	isActive,
	isDisabled,
	hasMessages,
}: {
	hasScrolled: boolean;
	setHasScrolled: React.Dispatch<React.SetStateAction<boolean>>;
	convo: ConvoWithDetails | null;
	isActive: boolean;
	isDisabled: boolean;
	hasMessages: boolean;
}) {
	const { params } = useRoute<RouteProp<CommonNavigatorParams, 'MessagesConversation'>>();
	const primaryMember = useMaybeProfileShadow(convo?.primaryMember);
	const moderationOpts = useModerationOpts();
	const primaryMemberModeration = useMemo(() => {
		if (!primaryMember || !moderationOpts) return null;
		return moderateProfile(primaryMember, moderationOpts);
	}, [primaryMember, moderationOpts]);

	const header = <MessagesListHeader convo={convo} />;

	let footer: React.ReactNode = null;
	if (isDisabled) {
		footer = <ChatDisabled />;
	} else if (convo && primaryMember && primaryMemberModeration?.blocked) {
		footer = (
			<MessagesListBlockedFooter
				recipient={primaryMember}
				convoId={convo.view.id}
				hasMessages={hasMessages}
				moderation={primaryMemberModeration}
			/>
		);
	} else if (convo?.kind === 'group') {
		if (convo.details.lockStatus === 'locked') {
			footer = <ChatLocked convo={convo} />;
		} else if (convo.details.lockStatus === 'locked-permanently') {
			footer = <ChatEnded convo={convo} />;
		}
	}

	return (
		<>
			{header}
			{isActive && (
				<MessagesList
					hasScrolled={hasScrolled}
					setHasScrolled={setHasScrolled}
					hasAcceptOverride={!!params.accept}
					transparentHeaderHeight={0}
					footer={footer}
				/>
			)}
		</>
	);
}
