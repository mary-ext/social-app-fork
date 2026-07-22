import { useCallback, useEffect, useRef, useState } from 'react';

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

import { MessagesListBlockedFooter } from '#/components/dms/MessagesListBlockedFooter';
import { MessagesListHeader } from '#/components/dms/MessagesListHeader';
import { type ConvoWithDetails, parseConvoView } from '#/components/dms/util';
import { Error } from '#/components/Error';
import * as Layout from '#/components/web/Layout';

import { m } from '#/paraglide/messages';
import { useFocusEffect, useIsFocused, useNavigate, useParams } from '#/routes';

import { ChatDisabled } from './components/ChatDisabled';
import { ChatEnded } from './components/ChatEnded';
import { ChatLocked } from './components/ChatLocked';
import * as css from './Conversation.css';

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
		<Layout.Screen className={css.screen} noInsetTop={false}>
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
				<div className={css.full}>
					<MessagesListHeader convo={convo} />
				</div>
				<Error
					message={m['screens.messages.conversation.loadError']()}
					onRetry={() => convoState.error.retry()}
					title={m['common.error.generic']()}
				/>
			</>
		);
	}

	return (
		<div className={css.inner}>
			<InnerReady
				convo={convo}
				hasScrolled={hasScrolled}
				isActive={isConvoActive(convoState)}
				isDisabled={convoState.status === ConvoStatus.Disabled}
				setHasScrolled={setHasScrolled}
			/>
		</div>
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

	// the request banner floats below the header, so track the header's height to position it.
	const [headerHeight, setHeaderHeight] = useState(0);
	const headerRef = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		const node = headerRef.current;
		if (!node) {
			return;
		}
		const observer = new ResizeObserver(() => setHeaderHeight(node.offsetHeight));
		observer.observe(node);
		setHeaderHeight(node.offsetHeight);
		return () => observer.disconnect();
	}, []);

	const unreadRequestCount = convo?.kind === 'group' ? (convo.details.unreadJoinRequestCount ?? 0) : 0;
	const { mutate: markJoinRequestsRead } = useMarkJoinRequestsRead(convo?.view.id);

	const header = <MessagesListHeader convo={convo} ref={headerRef} />;

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
			{header}

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
					footer={footer}
				/>
			)}
		</>
	);
}
