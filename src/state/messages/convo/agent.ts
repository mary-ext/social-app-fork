import type {
	AppBskyEmbedRecord,
	ChatBskyActorDefs,
	ChatBskyConvoDefs,
	ChatBskyConvoGetLog,
	ChatBskyConvoSendMessage,
	ChatBskyEmbedJoinLink,
	ChatBskyGroupDefs,
} from '@atcute/bluesky';
import { type Client, ClientResponseError, ok } from '@atcute/client';
import type { $type, Did } from '@atcute/lexicons';
import { EventEmitter } from 'eventemitter3';
import { nanoid } from 'nanoid/non-secure';

import { networkRetry } from '#/lib/async/retry';
import { isErrorMaybeAppPasswordPermissions, isNetworkError } from '#/lib/strings/errors';

import {
	ACTIVE_POLL_INTERVAL,
	BACKGROUND_POLL_INTERVAL,
	INACTIVE_TIMEOUT,
	NETWORK_FAILURE_STATUSES,
} from '#/state/messages/convo/const';
import {
	type ConvoDispatch,
	ConvoDispatchEvent,
	type ConvoError,
	ConvoErrorCode,
	type ConvoEvent,
	type ConvoItem,
	ConvoItemError,
	type ConvoParams,
	type ConvoState,
	ConvoStatus,
} from '#/state/messages/convo/types';
import type { MessagesEventBus } from '#/state/messages/events/agent';
import type { MessagesEventBusError } from '#/state/messages/events/types';

import { Logger } from '#/logger';

import { type ConvoWithDetails, type GroupConvoMember, parseConvoView } from '#/components/dms/util';

const logger = Logger.create(Logger.Context.ConversationAgent);

export function isConvoItemMessage(item: ConvoItem): item is ConvoItem & { type: 'message' } {
	if (!item) return false;
	return item.type === 'message' || item.type === 'deleted-message' || item.type === 'pending-message';
}

function toSystemMessageView(
	ev: ChatBskyConvoGetLog.$output['logs'][number],
): ChatBskyConvoDefs.SystemMessageView | null {
	switch (ev.$type) {
		case 'chat.bsky.convo.defs#logAddMember':
		case 'chat.bsky.convo.defs#logRemoveMember':
		case 'chat.bsky.convo.defs#logMemberJoin':
		case 'chat.bsky.convo.defs#logMemberLeave':
		case 'chat.bsky.convo.defs#logLockConvo':
		case 'chat.bsky.convo.defs#logUnlockConvo':
		case 'chat.bsky.convo.defs#logLockConvoPermanently':
		case 'chat.bsky.convo.defs#logEditGroup':
		case 'chat.bsky.convo.defs#logCreateJoinLink':
		case 'chat.bsky.convo.defs#logEditJoinLink':
		case 'chat.bsky.convo.defs#logEnableJoinLink':
		case 'chat.bsky.convo.defs#logDisableJoinLink':
			return ev.message;
		default:
			return null;
	}
}

export class Convo {
	private id: string;

	private chat: Client;
	private events: MessagesEventBus;
	private senderUserDid: Did;

	private status: ConvoStatus = ConvoStatus.Uninitialized;
	private error: ConvoError | undefined;
	private oldestRev: string | undefined | null = undefined;
	private isFetchingHistory = false;
	private latestRev: string | undefined = undefined;

	private pastMessages: Map<
		string,
		ChatBskyConvoDefs.MessageView | ChatBskyConvoDefs.DeletedMessageView | ChatBskyConvoDefs.SystemMessageView
	> = new Map();
	private newMessages: Map<
		string,
		ChatBskyConvoDefs.MessageView | ChatBskyConvoDefs.DeletedMessageView | ChatBskyConvoDefs.SystemMessageView
	> = new Map();
	private pendingMessages: Map<
		string,
		{
			id: string;
			message: ChatBskyConvoSendMessage.$input['message'];
			optimisticEmbedView?:
				| $type.enforce<AppBskyEmbedRecord.View>
				| $type.enforce<ChatBskyEmbedJoinLink.View>;
		}
	> = new Map();
	private deletedMessages: Set<string> = new Set();
	private relatedProfiles: Map<string, ChatBskyActorDefs.ProfileViewBasic> = new Map();

	private isProcessingPendingMessages = false;

	private lastActiveTimestamp: number | undefined;

	private emitter = new EventEmitter<{ event: [ConvoEvent] }>();

	convoId: string;
	convo: ConvoWithDetails | undefined;
	sender: ChatBskyActorDefs.ProfileViewBasic | undefined;
	recipients: ChatBskyActorDefs.ProfileViewBasic[] | undefined;
	snapshot: ConvoState | undefined;

	constructor(params: ConvoParams) {
		this.id = nanoid(3);
		this.convoId = params.convoId;
		this.chat = params.chat;
		this.events = params.events;
		this.senderUserDid = params.currentDid;

		if (params.placeholderData) {
			this.setupPlaceholderData(params.placeholderData);
		}

		this.setConvo = this.setConvo.bind(this);
		this.subscribe = this.subscribe.bind(this);
		this.getSnapshot = this.getSnapshot.bind(this);
		this.sendMessage = this.sendMessage.bind(this);
		this.deleteMessage = this.deleteMessage.bind(this);
		this.fetchMessageHistory = this.fetchMessageHistory.bind(this);
		this.ingestFirehose = this.ingestFirehose.bind(this);
		this.onFirehoseConnect = this.onFirehoseConnect.bind(this);
		this.onFirehoseError = this.onFirehoseError.bind(this);
		this.markConvoAccepted = this.markConvoAccepted.bind(this);
		this.addReaction = this.addReaction.bind(this);
		this.removeReaction = this.removeReaction.bind(this);
		this.updateGroupName = this.updateGroupName.bind(this);
		this.updateGroupMembers = this.updateGroupMembers.bind(this);
		this.updateJoinLink = this.updateJoinLink.bind(this);
		this.updateLockStatus = this.updateLockStatus.bind(this);
	}

	private commit() {
		this.snapshot = undefined;
		this.subscribers.forEach((subscriber) => subscriber());
	}

	private subscribers: (() => void)[] = [];

	subscribe(subscriber: () => void) {
		if (this.subscribers.length === 0) this.init();

		this.subscribers.push(subscriber);

		return () => {
			this.subscribers = this.subscribers.filter((s) => s !== subscriber);
			if (this.subscribers.length === 0) this.suspend();
		};
	}

	getSnapshot(): ConvoState {
		if (!this.snapshot) this.snapshot = this.generateSnapshot();
		// logger.debug('snapshotted', {})
		return this.snapshot;
	}

	private generateSnapshot(): ConvoState {
		const shared = {
			isFetchingHistory: this.isFetchingHistory,
			// Explicit null check since the value is initially undefined.
			hasAllHistory: this.oldestRev === null,
		};

		const methods = {
			deleteMessage: this.deleteMessage,
			sendMessage: this.sendMessage,
			fetchMessageHistory: this.fetchMessageHistory,
			markConvoAccepted: this.markConvoAccepted,
			addReaction: this.addReaction,
			removeReaction: this.removeReaction,
		};

		const emptyMethods = {
			deleteMessage: undefined,
			sendMessage: undefined,
			fetchMessageHistory: undefined,
			markConvoAccepted: undefined,
			addReaction: undefined,
			removeReaction: undefined,
		};

		switch (this.status) {
			case ConvoStatus.Initializing: {
				return {
					status: ConvoStatus.Initializing,
					items: [],
					convo: this.convo,
					error: undefined,
					...shared,
					...emptyMethods,
				};
			}
			case ConvoStatus.Disabled: {
				return {
					status: this.status,
					items: this.getItems(),
					convo: this.convo!,
					relatedProfiles: this.relatedProfiles,
					error: undefined,
					...shared,
					...methods,
				};
			}
			case ConvoStatus.Suspended: {
				return {
					status: this.status,
					items: this.getItems(),
					convo: this.convo!,
					relatedProfiles: this.relatedProfiles,
					error: undefined,
					...shared,
					...methods,
				};
			}
			case ConvoStatus.Backgrounded: {
				return {
					status: this.status,
					items: this.getItems(),
					convo: this.convo!,
					relatedProfiles: this.relatedProfiles,
					error: undefined,
					...shared,
					...methods,
				};
			}
			case ConvoStatus.Ready: {
				return {
					status: this.status,
					items: this.getItems(),
					convo: this.convo!,
					relatedProfiles: this.relatedProfiles,
					error: undefined,
					...shared,
					...methods,
				};
			}
			case ConvoStatus.Error: {
				return {
					status: ConvoStatus.Error,
					items: [],
					convo: undefined,
					error: this.error!,
					isFetchingHistory: false,
					hasAllHistory: false,
					...emptyMethods,
				};
			}
			default: {
				return {
					status: ConvoStatus.Uninitialized,
					items: [],
					convo: this.convo,
					error: undefined,
					isFetchingHistory: false,
					// Explicit null check since the value is initially undefined.
					hasAllHistory: this.oldestRev === null,
					...emptyMethods,
				};
			}
		}
	}

	dispatch(action: ConvoDispatch) {
		const prevStatus = this.status;

		switch (this.status) {
			case ConvoStatus.Uninitialized: {
				switch (action.event) {
					case ConvoDispatchEvent.Init: {
						this.status = ConvoStatus.Initializing;
						void this.setup();
						this.setupFirehose();
						this.requestPollInterval(ACTIVE_POLL_INTERVAL);
						break;
					}
				}
				break;
			}
			case ConvoStatus.Initializing: {
				switch (action.event) {
					case ConvoDispatchEvent.Ready: {
						this.status = ConvoStatus.Ready;
						void this.fetchMessageHistory();
						break;
					}
					case ConvoDispatchEvent.Background: {
						this.status = ConvoStatus.Backgrounded;
						void this.fetchMessageHistory();
						this.requestPollInterval(BACKGROUND_POLL_INTERVAL);
						break;
					}
					case ConvoDispatchEvent.Suspend: {
						this.status = ConvoStatus.Suspended;
						this.cleanupFirehoseConnection?.();
						this.withdrawRequestedPollInterval();
						break;
					}
					case ConvoDispatchEvent.Error: {
						this.status = ConvoStatus.Error;
						this.error = action.payload;
						this.cleanupFirehoseConnection?.();
						this.withdrawRequestedPollInterval();
						break;
					}
					case ConvoDispatchEvent.Disable: {
						this.status = ConvoStatus.Disabled;
						void this.fetchMessageHistory(); // finish init
						this.cleanupFirehoseConnection?.();
						this.withdrawRequestedPollInterval();
						break;
					}
				}
				break;
			}
			case ConvoStatus.Ready: {
				switch (action.event) {
					case ConvoDispatchEvent.Resume: {
						void this.refreshConvo();
						this.requestPollInterval(ACTIVE_POLL_INTERVAL);
						break;
					}
					case ConvoDispatchEvent.Background: {
						this.status = ConvoStatus.Backgrounded;
						this.requestPollInterval(BACKGROUND_POLL_INTERVAL);
						break;
					}
					case ConvoDispatchEvent.Suspend: {
						this.status = ConvoStatus.Suspended;
						this.cleanupFirehoseConnection?.();
						this.withdrawRequestedPollInterval();
						break;
					}
					case ConvoDispatchEvent.Error: {
						this.status = ConvoStatus.Error;
						this.error = action.payload;
						this.cleanupFirehoseConnection?.();
						this.withdrawRequestedPollInterval();
						break;
					}
					case ConvoDispatchEvent.Disable: {
						this.status = ConvoStatus.Disabled;
						this.cleanupFirehoseConnection?.();
						this.withdrawRequestedPollInterval();
						break;
					}
				}
				break;
			}
			case ConvoStatus.Backgrounded: {
				switch (action.event) {
					case ConvoDispatchEvent.Resume: {
						if (this.wasChatInactive()) {
							this.reset();
						} else {
							if (this.convo) {
								this.status = ConvoStatus.Ready;
								void this.refreshConvo();
								this.maybeRecoverFromNetworkError();
							} else {
								this.status = ConvoStatus.Initializing;
								void this.setup();
							}
							this.requestPollInterval(ACTIVE_POLL_INTERVAL);
						}
						break;
					}
					case ConvoDispatchEvent.Suspend: {
						this.status = ConvoStatus.Suspended;
						this.cleanupFirehoseConnection?.();
						this.withdrawRequestedPollInterval();
						break;
					}
					case ConvoDispatchEvent.Error: {
						this.status = ConvoStatus.Error;
						this.error = action.payload;
						this.cleanupFirehoseConnection?.();
						this.withdrawRequestedPollInterval();
						break;
					}
					case ConvoDispatchEvent.Disable: {
						this.status = ConvoStatus.Disabled;
						this.cleanupFirehoseConnection?.();
						this.withdrawRequestedPollInterval();
						break;
					}
				}
				break;
			}
			case ConvoStatus.Suspended: {
				switch (action.event) {
					case ConvoDispatchEvent.Init: {
						this.reset();
						break;
					}
					case ConvoDispatchEvent.Resume: {
						this.reset();
						break;
					}
					case ConvoDispatchEvent.Error: {
						this.status = ConvoStatus.Error;
						this.error = action.payload;
						break;
					}
					case ConvoDispatchEvent.Disable: {
						this.status = ConvoStatus.Disabled;
						break;
					}
				}
				break;
			}
			case ConvoStatus.Error: {
				switch (action.event) {
					case ConvoDispatchEvent.Init: {
						this.reset();
						break;
					}
					case ConvoDispatchEvent.Resume: {
						this.reset();
						break;
					}
					case ConvoDispatchEvent.Suspend: {
						this.status = ConvoStatus.Suspended;
						break;
					}
					case ConvoDispatchEvent.Error: {
						this.status = ConvoStatus.Error;
						this.error = action.payload;
						break;
					}
					case ConvoDispatchEvent.Disable: {
						this.status = ConvoStatus.Disabled;
						break;
					}
				}
				break;
			}
			case ConvoStatus.Disabled: {
				// can't do anything
				break;
			}
			default:
				break;
		}

		logger.debug(`dispatch '${action.event}'`, {
			id: this.id,
			prev: prevStatus,
			next: this.status,
		});

		this.updateLastActiveTimestamp();
		this.commit();
	}

	private reset() {
		this.convo = undefined;
		this.snapshot = undefined;

		this.status = ConvoStatus.Uninitialized;
		this.error = undefined;
		this.oldestRev = undefined;
		this.latestRev = undefined;

		this.pastMessages = new Map();
		this.newMessages = new Map();
		this.pendingMessages = new Map();
		this.deletedMessages = new Set();
		this.relatedProfiles = new Map();

		this.pendingMessageFailure = null;
		this.fetchMessageHistoryError = undefined;
		this.firehoseError = undefined;

		this.dispatch({ event: ConvoDispatchEvent.Init });
	}

	maybeRecoverFromNetworkError() {
		if (this.firehoseError) {
			this.firehoseError.retry();
			this.firehoseError = undefined;
			this.commit();
		} else {
			void this.batchRetryPendingMessages();
		}

		if (this.fetchMessageHistoryError) {
			this.fetchMessageHistoryError.retry();
			this.fetchMessageHistoryError = undefined;
			this.commit();
		}
	}

	private setConvo(convo: ChatBskyConvoDefs.ConvoView) {
		this.convo = parseConvoView(convo, this.senderUserDid) ?? this.convo;
		if (this.convo) {
			for (const member of this.convo.members) {
				this.relatedProfiles.set(member.did, member);
			}
		}
	}

	private updateConvo(convo: Partial<ChatBskyConvoDefs.ConvoView>) {
		if (this.convo) {
			this.convo = parseConvoView({ ...this.convo.view, ...convo }, this.senderUserDid) ?? this.convo;
			for (const member of this.convo.members) {
				this.relatedProfiles.set(member.did, member);
			}
		}
	}

	/**
	 * Initialises the convo with placeholder data, if provided. We still refetch it before rendering the convo,
	 * but this allows us to render the convo header immediately.
	 */
	private setupPlaceholderData(data: NonNullable<ConvoParams['placeholderData']>) {
		this.setConvo(data.convo);
	}

	private async setup() {
		try {
			const { convo } = await this.fetchConvo();

			this.setConvo(convo);

			/*
			 * Some validation prior to `Ready` status
			 */
			if (!this.convo) {
				throw new Error('could not find convo');
			}

			const self = this.convo.members.find((m) => m.did === this.senderUserDid);

			if (!self) {
				throw new Error('could not find self in convo');
			}

			const userIsDisabled = Boolean(self.chatDisabled);

			if (userIsDisabled) {
				this.dispatch({ event: ConvoDispatchEvent.Disable });
			} else {
				this.dispatch({ event: ConvoDispatchEvent.Ready });
			}
		} catch (err) {
			const e = err as Error;
			if (!isNetworkError(e) && !isErrorMaybeAppPasswordPermissions(e)) {
				logger.error('setup failed', {
					safeMessage: e.message,
				});
			}

			this.dispatch({
				event: ConvoDispatchEvent.Error,
				payload: {
					exception: e,
					code: ConvoErrorCode.InitFailed,
					retry: () => {
						this.reset();
					},
				},
			});
			this.commit();
		}
	}

	init() {
		this.dispatch({ event: ConvoDispatchEvent.Init });
	}

	resume() {
		this.dispatch({ event: ConvoDispatchEvent.Resume });
	}

	background() {
		this.dispatch({ event: ConvoDispatchEvent.Background });
	}

	suspend() {
		this.dispatch({ event: ConvoDispatchEvent.Suspend });
	}

	/**
	 * Called on any state transition, like when the chat is backgrounded. This value is then checked on
	 * background -> foreground transitions.
	 */
	private updateLastActiveTimestamp() {
		this.lastActiveTimestamp = Date.now();
	}
	private wasChatInactive() {
		if (!this.lastActiveTimestamp) return true;
		return Date.now() - this.lastActiveTimestamp > INACTIVE_TIMEOUT;
	}

	private requestedPollInterval: (() => void) | undefined;
	private requestPollInterval(interval: number) {
		this.withdrawRequestedPollInterval();
		this.requestedPollInterval = this.events.requestPollInterval(interval);
	}
	private withdrawRequestedPollInterval() {
		if (this.requestedPollInterval) {
			this.requestedPollInterval();
		}
	}

	private pendingFetchConvo: Promise<{ convo: ChatBskyConvoDefs.ConvoView }> | undefined;
	async fetchConvo() {
		if (this.pendingFetchConvo) return this.pendingFetchConvo;

		// non-blocking
		void this.fetchMemberList();

		this.pendingFetchConvo = (async () => {
			try {
				const data = await networkRetry(2, () => {
					return ok(
						this.chat.get('chat.bsky.convo.getConvo', {
							params: { convoId: this.convoId },
						}),
					);
				});

				const convo = data.convo;

				return {
					convo,
				};
			} finally {
				this.pendingFetchConvo = undefined;
			}
		})();

		return this.pendingFetchConvo;
	}

	async refreshConvo() {
		try {
			void this.fetchMemberList();
			const { convo } = await this.fetchConvo();
			// throw new Error('UNCOMMENT TO TEST REFRESH FAILURE')
			this.setConvo(convo);
		} catch (err) {
			const e = err as Error;
			if (!isNetworkError(e) && !isErrorMaybeAppPasswordPermissions(e)) {
				logger.error(`failed to refresh convo`, {
					safeMessage: e.message,
				});
			}
		}
	}

	// purely for populating `this.relatedProfiles` - we do not pipe it
	// into the ConvoWithDetails. If you want to drive UI based on the member list,
	// use `useListConvoMembersQuery`
	// we shouldn't also block loading off of this - the UI should be resilient
	async fetchMemberList() {
		let cursor: string | undefined;
		do {
			const data = await networkRetry(2, () => {
				return ok(
					this.chat.get('chat.bsky.convo.getConvoMembers', {
						params: { convoId: this.convoId, limit: 50, cursor },
					}),
				);
			});
			cursor = data.cursor;

			for (const member of data.members) {
				this.relatedProfiles.set(member.did, member);
			}
		} while (cursor);
	}

	private fetchMessageHistoryError: { retry: () => void } | undefined;
	async fetchMessageHistory() {
		logger.debug('fetch message history', {});

		/*
		 * If oldestRev is null, we've fetched all history.
		 * Needs to explicitly check for `null` since this is initially `undefined`.
		 */
		if (this.oldestRev === null) return;

		/*
		 * Don't fetch again if a fetch is already in progress
		 */
		if (this.isFetchingHistory) return;

		/*
		 * If we've rendered a retry state for history fetching, exit. Upon retry,
		 * this will be removed and we'll try again.
		 */
		if (this.fetchMessageHistoryError) return;

		try {
			this.isFetchingHistory = true;
			this.commit();

			const nextCursor = this.oldestRev; // for TS
			const data = await networkRetry(2, () => {
				return ok(
					this.chat.get('chat.bsky.convo.getMessages', {
						params: { cursor: nextCursor, convoId: this.convoId, limit: 60 },
					}),
				);
			});
			const { cursor, messages, relatedProfiles } = data;

			this.oldestRev = cursor ?? null;

			if (relatedProfiles) {
				for (const profile of relatedProfiles) {
					this.relatedProfiles.set(profile.did, profile);
				}
			}

			/*
			 * If the response contained fewer messages than the limit, we know
			 * there are no more pages, regardless of whether a cursor was returned.
			 */
			if (messages.length < 60) {
				this.oldestRev = null;
			}

			for (const message of messages) {
				if (
					message.$type === 'chat.bsky.convo.defs#messageView' ||
					message.$type === 'chat.bsky.convo.defs#deletedMessageView' ||
					message.$type === 'chat.bsky.convo.defs#systemMessageView'
				) {
					/*
					 * If this message is already in new messages, it was added by the
					 * firehose ingestion, and we can safely overwrite it. This trusts
					 * the server on ordering, and keeps it in sync.
					 */
					if (this.newMessages.has(message.id)) {
						this.newMessages.delete(message.id);
					}
					this.pastMessages.set(message.id, message);
				}
			}
		} catch (err) {
			const e = err as Error;
			if (!isNetworkError(e) && !isErrorMaybeAppPasswordPermissions(e)) {
				logger.error('failed to fetch message history', {
					safeMessage: e.message,
				});
			}

			this.fetchMessageHistoryError = {
				retry: () => {
					void this.fetchMessageHistory();
				},
			};
		} finally {
			this.isFetchingHistory = false;
			this.commit();
		}
	}

	private cleanupFirehoseConnection: (() => void) | undefined;
	private setupFirehose() {
		// remove old listeners, if exist
		this.cleanupFirehoseConnection?.();

		// reconnect
		this.cleanupFirehoseConnection = this.events.on(
			(event) => {
				switch (event.type) {
					case 'connect': {
						this.onFirehoseConnect();
						break;
					}
					case 'error': {
						this.onFirehoseError(event.error);
						break;
					}
					case 'logs': {
						this.ingestFirehose(event.logs);
						break;
					}
				}
			},
			/*
			 * This is VERY important — we only want events for this convo.
			 */
			{ convoId: this.convoId },
		);
	}

	private firehoseError: MessagesEventBusError | undefined;

	onFirehoseConnect() {
		this.firehoseError = undefined;
		void this.batchRetryPendingMessages();
		this.commit();
	}

	onFirehoseError(error?: MessagesEventBusError) {
		this.firehoseError = error;
		this.commit();
	}

	ingestFirehose(events: ChatBskyConvoGetLog.$output['logs']) {
		let needsCommit = false;

		for (const ev of events) {
			/*
			 * If there's a rev, we should handle it. If there's not a rev, we don't
			 * know what it is.
			 */
			if ('rev' in ev && typeof ev.rev === 'string') {
				const isUninitialized = !this.latestRev;
				const isNewEvent = this.latestRev && ev.rev > this.latestRev;

				/*
				 * We received an event prior to fetching any history, so we can safely
				 * use this as the initial history cursor
				 */
				if (this.oldestRev === undefined && isUninitialized) {
					this.oldestRev = ev.rev;
				}

				/*
				 * We only care about new events
				 */
				if (isNewEvent || isUninitialized) {
					/*
					 * Update rev regardless of if it's a ev type we care about or not
					 */
					this.latestRev = ev.rev;

					if ('relatedProfiles' in ev && Array.isArray(ev.relatedProfiles)) {
						for (const profile of ev.relatedProfiles) {
							this.relatedProfiles.set(profile.did, profile);
						}
					}

					if (
						ev.$type === 'chat.bsky.convo.defs#logCreateMessage' &&
						ev.message.$type === 'chat.bsky.convo.defs#messageView'
					) {
						/**
						 * If this message is already in new messages, it was added by our sending logic, and is based on
						 * client-ordering. When we receive the "committed" event from the log, we should replace this
						 * reference and re-insert in order to respect the order we received from the log.
						 */
						if (this.newMessages.has(ev.message.id)) {
							this.newMessages.delete(ev.message.id);
						}
						this.newMessages.set(ev.message.id, ev.message);
						needsCommit = true;
					} else if (
						ev.$type === 'chat.bsky.convo.defs#logDeleteMessage' &&
						ev.message.$type === 'chat.bsky.convo.defs#deletedMessageView'
					) {
						/*
						 * Update if we have this in state. If we don't, don't worry about it.
						 */
						if (this.pastMessages.has(ev.message.id) || this.newMessages.has(ev.message.id)) {
							this.pastMessages.delete(ev.message.id);
							this.newMessages.delete(ev.message.id);
							this.deletedMessages.delete(ev.message.id);
							needsCommit = true;
						}
					} else if (
						(ev.$type === 'chat.bsky.convo.defs#logAddReaction' ||
							ev.$type === 'chat.bsky.convo.defs#logRemoveReaction') &&
						ev.message.$type === 'chat.bsky.convo.defs#messageView'
					) {
						/*
						 * Update if we have this in state - replace message wholesale. If we don't, don't worry about it.
						 */
						if (this.pastMessages.has(ev.message.id)) {
							this.pastMessages.set(ev.message.id, ev.message);
							needsCommit = true;
						}
						if (this.newMessages.has(ev.message.id)) {
							this.newMessages.set(ev.message.id, ev.message);
							needsCommit = true;
						}
					} else {
						const systemView = toSystemMessageView(ev);
						if (systemView) {
							this.newMessages.set(systemView.id, systemView);
							needsCommit = true;
						}
					}
				}
			}
		}

		if (needsCommit) {
			this.commit();
		}
	}

	private pendingMessageFailure: 'recoverable' | 'unrecoverable' | null = null;

	sendMessage(
		message: ChatBskyConvoSendMessage.$input['message'],
		optimisticEmbedView?: $type.enforce<AppBskyEmbedRecord.View> | $type.enforce<ChatBskyEmbedJoinLink.View>,
	) {
		// Ignore empty messages for now since they have no other purpose atm
		if (!message.text.trim() && !message.embed) return;

		logger.debug('send message', {});

		const tempId = nanoid();

		this.pendingMessageFailure = null;
		this.pendingMessages.set(tempId, {
			id: tempId,
			message,
			optimisticEmbedView,
		});
		if (this.convo?.view.status === 'request') {
			this.updateConvo({
				status: 'accepted',
			});
		}
		this.commit();

		if (!this.isProcessingPendingMessages && !this.pendingMessageFailure) {
			void this.processPendingMessages();
		}
	}

	markConvoAccepted() {
		this.updateConvo({
			status: 'accepted',
		});

		this.commit();
	}

	updateMuted(muted: boolean) {
		this.updateConvo({
			muted,
		});

		this.commit();
	}

	updateGroupName(name: string) {
		if (this.convo?.kind !== 'group') {
			throw new Error('updateGroupName can only be called on group convo');
		}

		this.updateConvo({
			kind: {
				...this.convo.details,
				name,
			},
		});

		this.commit();
	}

	updateGroupMembers(members: GroupConvoMember[], memberCount: number) {
		if (this.convo?.kind !== 'group') {
			throw new Error('updateGroupMembers can only be called on group convo');
		}

		this.updateConvo({
			members,
			kind: {
				...this.convo.details,
				memberCount,
			},
		});

		this.commit();
	}

	updateJoinLink(joinLink: ChatBskyGroupDefs.JoinLinkView | undefined) {
		if (this.convo?.kind !== 'group') {
			throw new Error('updateJoinLink can only be called on group convo');
		}

		this.updateConvo({
			kind: {
				...this.convo.details,
				joinLink,
			},
		});

		this.commit();
	}

	updateLockStatus(lockStatus: ChatBskyConvoDefs.ConvoLockStatus) {
		if (this.convo?.kind !== 'group') {
			throw new Error('updateLockStatus can only be called on group convo');
		}

		this.updateConvo({
			kind: {
				...this.convo.details,
				lockStatus,
			},
		});

		this.commit();
	}

	async processPendingMessages() {
		logger.debug(`processing messages (${this.pendingMessages.size} remaining)`, {});

		const pendingMessage = Array.from(this.pendingMessages.values()).shift();

		/*
		 * If there are no pending messages, we're done.
		 */
		if (!pendingMessage) {
			this.isProcessingPendingMessages = false;
			return;
		}

		try {
			this.isProcessingPendingMessages = true;

			const { id, message } = pendingMessage;

			const res = await ok(
				this.chat.post('chat.bsky.convo.sendMessage', {
					input: { convoId: this.convoId, message },
				}),
			);

			// remove from queue
			this.pendingMessages.delete(id);

			/*
			 * Insert into `newMessages` as soon as we have a real ID. That way, when
			 * we get an event log back, we can replace in situ.
			 */
			this.newMessages.set(res.id, {
				...res,
				$type: 'chat.bsky.convo.defs#messageView',
			});
			// render new message state, prior to firehose
			this.commit();

			// continue queue processing
			await this.processPendingMessages();
		} catch (err) {
			const e = err as Error;
			this.handleSendMessageFailure(e);
			this.isProcessingPendingMessages = false;
		}
	}

	private handleSendMessageFailure(e: Error | ClientResponseError) {
		if (e instanceof ClientResponseError) {
			if (NETWORK_FAILURE_STATUSES.includes(e.status)) {
				this.pendingMessageFailure = 'recoverable';
			} else {
				this.pendingMessageFailure = 'unrecoverable';

				switch (e.description) {
					case 'block between recipient and sender':
						this.emitter.emit('event', {
							type: 'invalidate-block-state',
							accountDids: [this.senderUserDid, ...this.recipients!.map((r) => r.did)],
						});
						break;
					case 'Account is disabled':
						this.dispatch({ event: ConvoDispatchEvent.Disable });
						break;
					case 'Convo not found':
					case 'Account does not exist':
					case 'recipient does not exist':
					case 'recipient requires incoming messages to come from someone they follow':
					case 'recipient has disabled incoming messages':
						break;
					default:
						if (!isNetworkError(e)) {
							logger.warn(`handleSendMessageFailure could not handle error`, {
								status: e.status,
								message: e.description,
							});
						}
						break;
				}
			}
		} else if (isNetworkError(e)) {
			// @atcute lets transport failures (offline/DNS/timeout) propagate as a plain TypeError rather
			// than a ClientResponseError, so they must be caught here to stay retryable.
			this.pendingMessageFailure = 'recoverable';
		} else {
			this.pendingMessageFailure = 'unrecoverable';

			if (!isErrorMaybeAppPasswordPermissions(e)) {
				logger.error(`handleSendMessageFailure received unknown error`, {
					safeMessage: e.message,
				});
			}
		}

		this.commit();
	}

	async batchRetryPendingMessages() {
		if (this.pendingMessageFailure === null) return;

		const messageArray = Array.from(this.pendingMessages.values());
		if (messageArray.length === 0) return;

		this.pendingMessageFailure = null;
		this.commit();

		logger.debug(`batch retrying ${this.pendingMessages.size} pending messages`, {});

		try {
			const data = await ok(
				this.chat.post('chat.bsky.convo.sendMessageBatch', {
					input: {
						items: messageArray.map(({ message }) => ({
							convoId: this.convoId,
							message,
						})),
					},
				}),
			);
			const { items } = data;

			/*
			 * Insert into `newMessages` as soon as we have a real ID. That way, when
			 * we get an event log back, we can replace in situ.
			 */
			for (const item of items) {
				this.newMessages.set(item.id, {
					...item,
					$type: 'chat.bsky.convo.defs#messageView',
				});
			}

			for (const pendingMessage of messageArray) {
				this.pendingMessages.delete(pendingMessage.id);
			}

			this.commit();

			logger.debug(`sent ${this.pendingMessages.size} pending messages`, {});
		} catch (err) {
			const e = err as Error;
			this.handleSendMessageFailure(e);
		}
	}

	async deleteMessage(messageId: string) {
		logger.debug('delete message', {});

		this.deletedMessages.add(messageId);
		this.commit();

		try {
			await networkRetry(2, () => {
				return ok(
					this.chat.post('chat.bsky.convo.deleteMessageForSelf', {
						input: { convoId: this.convoId, messageId },
					}),
				);
			});
		} catch (err) {
			const e = err as Error;
			if (!isNetworkError(e) && !isErrorMaybeAppPasswordPermissions(e)) {
				logger.error(`failed to delete message`, {
					safeMessage: e.message,
				});
			}
			this.deletedMessages.delete(messageId);
			this.commit();
			throw e;
		}
	}

	on(handler: (event: ConvoEvent) => void) {
		this.emitter.on('event', handler);

		return () => {
			this.emitter.off('event', handler);
		};
	}

	/*
	 * Items in reverse order, since FlatList inverts
	 */
	getItems(): ConvoItem[] {
		const items: ConvoItem[] = [];

		this.pastMessages.forEach((m) => {
			switch (m.$type) {
				case 'chat.bsky.convo.defs#messageView':
					items.unshift({ type: 'message', key: m.id, message: m });
					break;
				case 'chat.bsky.convo.defs#deletedMessageView':
					items.unshift({ type: 'deleted-message', key: m.id, message: m });
					break;
				case 'chat.bsky.convo.defs#systemMessageView':
					items.unshift({ type: 'system-message', key: m.id, message: m });
					break;
			}
		});

		if (this.fetchMessageHistoryError) {
			items.unshift({
				type: 'error',
				code: ConvoItemError.HistoryFailed,
				key: ConvoItemError.HistoryFailed,
				retry: () => {
					this.maybeRecoverFromNetworkError();
				},
			});
		}

		this.newMessages.forEach((m) => {
			switch (m.$type) {
				case 'chat.bsky.convo.defs#messageView':
					items.push({ type: 'message', key: m.id, message: m });
					break;
				case 'chat.bsky.convo.defs#deletedMessageView':
					items.push({ type: 'deleted-message', key: m.id, message: m });
					break;
				case 'chat.bsky.convo.defs#systemMessageView':
					items.push({ type: 'system-message', key: m.id, message: m });
					break;
			}
		});

		this.pendingMessages.forEach((m) => {
			items.push({
				type: 'pending-message',
				key: m.id,
				message: {
					...m.message,
					embed: m.optimisticEmbedView,
					$type: 'chat.bsky.convo.defs#messageView',
					id: nanoid(),
					rev: '__fake__',
					sentAt: new Date().toISOString(),
					sender: {
						$type: 'chat.bsky.convo.defs#messageViewSender',
						did: this.senderUserDid,
					},
				},
				failed: this.pendingMessageFailure !== null,
				retry:
					this.pendingMessageFailure === 'recoverable'
						? () => {
								this.maybeRecoverFromNetworkError();
							}
						: undefined,
			});
		});

		if (this.firehoseError) {
			items.push({
				type: 'error',
				code: ConvoItemError.FirehoseFailed,
				key: ConvoItemError.FirehoseFailed,
				retry: () => {
					this.firehoseError?.retry();
				},
			});
		}

		return items.filter((item) => {
			if (isConvoItemMessage(item)) {
				return !this.deletedMessages.has(item.message.id);
			}
			return true;
		});
	}

	/**
	 * Add an emoji reaction to a message
	 *
	 * @param messageId - the id of the message to add the reaction to
	 * @param emoji - must be one grapheme
	 */
	async addReaction(messageId: string, emoji: string) {
		const optimisticReaction = {
			value: emoji,
			sender: { did: this.senderUserDid },
			createdAt: new Date().toISOString(),
		};
		let restore: null | (() => void) = null;
		if (this.pastMessages.has(messageId)) {
			const prevMessage = this.pastMessages.get(messageId);
			if (
				prevMessage?.$type === 'chat.bsky.convo.defs#messageView' &&
				// skip optimistic update if reaction already exists
				!prevMessage.reactions?.find(
					(reaction) => reaction.sender.did === this.senderUserDid && reaction.value === emoji,
				)
			) {
				if (prevMessage.reactions) {
					if (
						prevMessage.reactions.filter((reaction) => reaction.sender.did === this.senderUserDid).length >= 5
					) {
						throw new Error('Maximum reactions reached');
					}
				}
				this.pastMessages.set(messageId, {
					...prevMessage,
					reactions: [...(prevMessage.reactions ?? []), optimisticReaction],
				});
				this.commit();
				restore = () => {
					this.pastMessages.set(messageId, prevMessage);
					this.commit();
				};
			}
		} else if (this.newMessages.has(messageId)) {
			const prevMessage = this.newMessages.get(messageId);
			if (
				prevMessage?.$type === 'chat.bsky.convo.defs#messageView' &&
				!prevMessage.reactions?.find((reaction) => reaction.value === emoji)
			) {
				if (prevMessage.reactions && prevMessage.reactions.length >= 5)
					throw new Error('Maximum reactions reached');
				this.newMessages.set(messageId, {
					...prevMessage,
					reactions: [...(prevMessage.reactions ?? []), optimisticReaction],
				});
				this.commit();
				restore = () => {
					this.newMessages.set(messageId, prevMessage);
					this.commit();
				};
			}
		}

		try {
			logger.debug(`Adding reaction ${emoji} to message ${messageId}`);
			const data = await ok(
				this.chat.post('chat.bsky.convo.addReaction', {
					input: { messageId, value: emoji, convoId: this.convoId },
				}),
			);
			if (data.message.$type === 'chat.bsky.convo.defs#messageView') {
				if (this.pastMessages.has(messageId)) {
					this.pastMessages.set(messageId, data.message);
					this.commit();
				} else if (this.newMessages.has(messageId)) {
					this.newMessages.set(messageId, data.message);
					this.commit();
				}
			}
		} catch (error) {
			if (restore) restore();
			throw error;
		}
	}

	/*
	 * Remove a reaction from a message.
	 *
	 * @param messageId - The ID of the message to remove the reaction from.
	 * @param emoji - The emoji to remove.
	 */
	async removeReaction(messageId: string, emoji: string) {
		let restore: null | (() => void) = null;
		if (this.pastMessages.has(messageId)) {
			const prevMessage = this.pastMessages.get(messageId);
			if (prevMessage?.$type === 'chat.bsky.convo.defs#messageView') {
				this.pastMessages.set(messageId, {
					...prevMessage,
					reactions: prevMessage.reactions?.filter(
						(reaction) => reaction.value !== emoji || reaction.sender.did !== this.senderUserDid,
					),
				});
				this.commit();
				restore = () => {
					this.pastMessages.set(messageId, prevMessage);
					this.commit();
				};
			}
		} else if (this.newMessages.has(messageId)) {
			const prevMessage = this.newMessages.get(messageId);
			if (prevMessage?.$type === 'chat.bsky.convo.defs#messageView') {
				this.newMessages.set(messageId, {
					...prevMessage,
					reactions: prevMessage.reactions?.filter(
						(reaction) => reaction.value !== emoji || reaction.sender.did !== this.senderUserDid,
					),
				});
				this.commit();
				restore = () => {
					this.newMessages.set(messageId, prevMessage);
					this.commit();
				};
			}
		}

		try {
			logger.debug(`Removing reaction ${emoji} from message ${messageId}`);
			await ok(
				this.chat.post('chat.bsky.convo.removeReaction', {
					input: { messageId, value: emoji, convoId: this.convoId },
				}),
			);
		} catch (error) {
			if (restore) restore();
			throw error;
		}
	}
}
