import { useCallback, useState } from 'react';
import { type LayoutChangeEvent, View } from 'react-native';

import { moderateProfile, ModerationCauseType } from '@atcute/bluesky-moderation';

import { useTitle } from '#/lib/hooks/useTitle';
import { useViewportZoomLock } from '#/lib/hooks/useViewportZoomLock';

import { useMaybeProfileShadow } from '#/state/cache/profile-shadow';
import { ConvoProvider, isConvoActive, useConvo } from '#/state/messages/convo';
import { ConvoStatus } from '#/state/messages/convo/types';
import { useCurrentConvoId } from '#/state/messages/current-convo-id';
import { useModerationOpts } from '#/state/preferences/moderation-opts';
import { useConvoQuery } from '#/state/queries/messages/conversation';
import { useMarkJoinRequestsRead } from '#/state/queries/messages/mark-join-request-read';
import { useSession } from '#/state/session';

import { MessagesList } from '#/screens/Messages/components/MessagesList';
import { RequestStatus } from '#/screens/Messages/components/RequestStatus';

import { atoms as a } from '#/alf';

import { MessagesListBlockedFooter } from '#/components/dms/MessagesListBlockedFooter';
import { MessagesListHeader } from '#/components/dms/MessagesListHeader';
import { type ConvoWithDetails, parseConvoView } from '#/components/dms/util';
import { Error } from '#/components/Error';
import * as Layout from '#/components/Layout';

import { m } from '#/paraglide/messages';
import { useFocusEffect, useIsFocused, useNavigate, useParams } from '#/routes';

import { ChatDisabled } from './components/ChatDisabled';
import { ChatEnded } from './components/ChatEnded';
import { ChatLocked } from './components/ChatLocked';

export function MessagesConversationScreen() {
	return <MessagesConversationScreenInner />;
}

export function MessagesConversationScreenInner() {
	const [{ conversation: convoId }] = useParams('MessagesConversation');
	const { setCurrentConvoId } = useCurrentConvoId();

	useTitle(m['common.chat.label']());

	useFocusEffect(
		useCallback(() => {
			setCurrentConvoId(convoId);

			return () => {
				setCurrentConvoId(undefined);
			};
		}, [convoId, setCurrentConvoId]),
	);

	return (
		<Layout.Screen testID="convoScreen" noInsetTop={false} style={[{ minHeight: 0 }, a.flex_1]}>
			<ConvoProvider key={convoId} convoId={convoId}>
				<Inner convoId={convoId} />
			</ConvoProvider>
		</Layout.Screen>
	);
}

function Inner({ convoId }: { convoId: string }) {
	const convoState = useConvo();
	const { currentAccount } = useSession();
	const isFocused = useIsFocused();
	const { data: convoData } = useConvoQuery({ convoId });

	useViewportZoomLock({ enabled: isFocused });

	const convo = convoData ? parseConvoView(convoData, currentAccount?.did) : null;

	const [hasScrolled, setHasScrolled] = useState(false);

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
					title={m['common.error.generic']()}
					message={m['screens.messages.conversation.loadError']()}
					onRetry={() => convoState.error.retry()}
					sideBorders={false}
				/>
			</>
		);
	}

	return (
		<Layout.Center style={[a.flex_1]}>
			<View style={[a.flex_1]}>
				<InnerReady
					convo={convo}
					hasScrolled={hasScrolled}
					setHasScrolled={setHasScrolled}
					isActive={isConvoActive(convoState)}
					isDisabled={convoState.status === ConvoStatus.Disabled}
				/>
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
}: {
	hasScrolled: boolean;
	setHasScrolled: React.Dispatch<React.SetStateAction<boolean>>;
	convo: ConvoWithDetails | null;
	isActive: boolean;
	isDisabled: boolean;
}) {
	const [{ accept }] = useParams('MessagesConversation');
	const navigate = useNavigate();
	const primaryMember = useMaybeProfileShadow(convo?.primaryMember);
	const moderationOpts = useModerationOpts();
	let primaryMemberModeration = null;
	if (primaryMember && moderationOpts) {
		primaryMemberModeration = moderateProfile(primaryMember, moderationOpts);
	}

	const [headerHeight, setHeaderHeight] = useState(0);
	const onHeaderLayout = (e: LayoutChangeEvent) => {
		setHeaderHeight(e.nativeEvent.layout.height);
	};

	const unreadRequestCount = convo?.kind === 'group' ? (convo.details.unreadJoinRequestCount ?? 0) : 0;
	const { mutate: markJoinRequestsRead } = useMarkJoinRequestsRead(convo?.view.id);

	const header = <MessagesListHeader convo={convo} />;

	let footer: React.ReactNode = null;
	if (isDisabled) {
		footer = <ChatDisabled />;
	} else if (
		convo &&
		primaryMember &&
		primaryMemberModeration &&
		(convo.kind === 'group'
			? primaryMemberModeration?.causes.some((c) => c.type === ModerationCauseType.Blocking)
			: primaryMemberModeration?.causes.some(
					(c) => c.type === ModerationCauseType.Blocking || c.type === ModerationCauseType.BlockedBy,
				))
	) {
		footer = (
			<MessagesListBlockedFooter
				recipient={primaryMember}
				convoId={convo.view.id}
				isGroup={convo.kind === 'group'}
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
			<View onLayout={onHeaderLayout}>{header}</View>

			{isActive && convo?.kind === 'group' && unreadRequestCount > 0 ? (
				<RequestStatus
					top={headerHeight}
					count={unreadRequestCount}
					onDismiss={() => {
						markJoinRequestsRead();
					}}
					onPress={() => {
						markJoinRequestsRead();
						navigate('MessagesJoinRequests', {
							conversation: convo.view.id,
						});
					}}
				/>
			) : null}

			{isActive && (
				<MessagesList
					hasScrolled={hasScrolled}
					setHasScrolled={setHasScrolled}
					hasAcceptOverride={!!accept}
					transparentHeaderHeight={0}
					footer={footer}
				/>
			)}
		</>
	);
}
