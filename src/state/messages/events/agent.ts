import type { ChatBskyConvoGetLog } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

import { isNetworkError } from '#/lib/errors';
import { networkRetry } from '#/lib/utils/retry';

import { BACKGROUND_POLL_INTERVAL, DEFAULT_POLL_INTERVAL } from '#/state/messages/events/const';
import {
	type MessagesEventBusDispatch,
	MessagesEventBusDispatchEvent,
	MessagesEventBusErrorCode,
	type MessagesEventBusEvent,
	type MessagesEventBusParams,
	MessagesEventBusStatus,
} from '#/state/messages/events/types';

export class MessagesEventBus {
	private chat: Client;
	private emitter = new SimpleEventEmitter<[MessagesEventBusEvent]>();

	private status: MessagesEventBusStatus = MessagesEventBusStatus.Initializing;
	private hasInitialized = false;
	/** consumer activity requested during initialization. */
	private intendedStatus:
		| MessagesEventBusStatus.Backgrounded
		| MessagesEventBusStatus.Ready
		| MessagesEventBusStatus.Suspended = MessagesEventBusStatus.Suspended;
	private latestRev: string | undefined = undefined;
	private pollInterval = DEFAULT_POLL_INTERVAL;
	private requestedPollIntervals: Map<string, number> = new Map();

	constructor(params: MessagesEventBusParams) {
		this.chat = params.chat;
	}

	requestPollInterval(interval: number) {
		const id = crypto.randomUUID();
		this.requestedPollIntervals.set(id, interval);
		this.dispatch({
			event: MessagesEventBusDispatchEvent.UpdatePoll,
		});
		return () => {
			this.requestedPollIntervals.delete(id);
			this.dispatch({
				event: MessagesEventBusDispatchEvent.UpdatePoll,
			});
		};
	}

	getLatestRev() {
		return this.latestRev;
	}

	on(
		handler: (event: MessagesEventBusEvent) => void,
		options: {
			convoId?: string;
		},
	) {
		const handle = (event: MessagesEventBusEvent) => {
			if (event.type === 'logs' && options.convoId) {
				const filteredLogs = event.logs.filter((log) => {
					if ('convoId' in log && log.convoId === options.convoId) {
						return log.convoId === options.convoId;
					}
					return false;
				});

				if (filteredLogs.length > 0) {
					handler({
						...event,
						logs: filteredLogs,
					});
				}
			} else {
				handler(event);
			}
		};

		this.emitter.subscribe(handle);

		return () => {
			this.emitter.unsubscribe(handle);
		};
	}

	background() {
		this.intendedStatus = MessagesEventBusStatus.Backgrounded;
		// wait for cursor initialization before polling.
		if (this.status === MessagesEventBusStatus.Initializing) {
			return;
		}
		this.dispatch({ event: MessagesEventBusDispatchEvent.Background });
	}

	suspend() {
		this.intendedStatus = MessagesEventBusStatus.Suspended;
		// do not start polling for a consumer that unmounted during init.
		if (this.status === MessagesEventBusStatus.Initializing) {
			return;
		}
		this.dispatch({ event: MessagesEventBusDispatchEvent.Suspend });
	}

	resume() {
		this.intendedStatus = MessagesEventBusStatus.Ready;
		if (this.status === MessagesEventBusStatus.Initializing) {
			// seed the cursor once; completion applies intendedStatus.
			if (!this.hasInitialized) {
				this.hasInitialized = true;
				void this.init();
			}
			return;
		}
		this.dispatch({ event: MessagesEventBusDispatchEvent.Resume });
	}

	private dispatch(action: MessagesEventBusDispatch) {
		switch (this.status) {
			case MessagesEventBusStatus.Initializing: {
				switch (action.event) {
					case MessagesEventBusDispatchEvent.Ready: {
						this.activateAfterInit();
						break;
					}
					case MessagesEventBusDispatchEvent.Error: {
						this.status = MessagesEventBusStatus.Error;
						this.emitter.emit({ type: 'error', error: action.payload });
						break;
					}
				}
				break;
			}
			case MessagesEventBusStatus.Ready: {
				switch (action.event) {
					case MessagesEventBusDispatchEvent.Background: {
						this.status = MessagesEventBusStatus.Backgrounded;
						this.resetPoll();
						break;
					}
					case MessagesEventBusDispatchEvent.Suspend: {
						this.status = MessagesEventBusStatus.Suspended;
						this.stopPoll();
						break;
					}
					case MessagesEventBusDispatchEvent.Error: {
						this.status = MessagesEventBusStatus.Error;
						this.stopPoll();
						this.emitter.emit({ type: 'error', error: action.payload });
						break;
					}
					case MessagesEventBusDispatchEvent.UpdatePoll: {
						this.resetPoll();
						break;
					}
				}
				break;
			}
			case MessagesEventBusStatus.Backgrounded: {
				switch (action.event) {
					case MessagesEventBusDispatchEvent.Resume: {
						this.status = MessagesEventBusStatus.Ready;
						this.resetPoll();
						break;
					}
					case MessagesEventBusDispatchEvent.Suspend: {
						this.status = MessagesEventBusStatus.Suspended;
						this.stopPoll();
						break;
					}
					case MessagesEventBusDispatchEvent.Error: {
						this.status = MessagesEventBusStatus.Error;
						this.stopPoll();
						this.emitter.emit({ type: 'error', error: action.payload });
						break;
					}
					case MessagesEventBusDispatchEvent.UpdatePoll: {
						this.resetPoll();
						break;
					}
				}
				break;
			}
			case MessagesEventBusStatus.Suspended: {
				switch (action.event) {
					case MessagesEventBusDispatchEvent.Resume: {
						this.status = MessagesEventBusStatus.Ready;
						this.resetPoll();
						break;
					}
					case MessagesEventBusDispatchEvent.Background: {
						this.status = MessagesEventBusStatus.Backgrounded;
						this.resetPoll();
						break;
					}
					case MessagesEventBusDispatchEvent.Error: {
						this.status = MessagesEventBusStatus.Error;
						this.stopPoll();
						this.emitter.emit({ type: 'error', error: action.payload });
						break;
					}
				}
				break;
			}
			case MessagesEventBusStatus.Error: {
				switch (action.event) {
					case MessagesEventBusDispatchEvent.UpdatePoll:
					case MessagesEventBusDispatchEvent.Resume: {
						this.recoverFromError();
						break;
					}
				}
				break;
			}
			default:
				break;
		}
	}

	/** applies the requested status after cursor initialization. */
	private activateAfterInit() {
		switch (this.intendedStatus) {
			case MessagesEventBusStatus.Suspended: {
				// do not start a poller without listeners.
				this.status = MessagesEventBusStatus.Suspended;
				return;
			}
			case MessagesEventBusStatus.Backgrounded: {
				this.status = MessagesEventBusStatus.Backgrounded;
				break;
			}
			case MessagesEventBusStatus.Ready: {
				this.status = MessagesEventBusStatus.Ready;
				break;
			}
		}

		// init already fetched the latest cursor.
		this.resetPoll({ immediate: false });
		this.emitter.emit({ type: 'connect' });
	}

	private recoverFromError() {
		if (this.latestRev === undefined) {
			// reinitialize when no cursor exists.
			this.status = MessagesEventBusStatus.Initializing;
			void this.init();
		} else {
			// resume from the stored cursor; reinitializing could skip events.
			this.status = MessagesEventBusStatus.Ready;
			this.resetPoll();
			this.emitter.emit({ type: 'connect' });
		}
	}

	private async init() {
		try {
			const data = await networkRetry(2, () => {
				return ok(this.chat.get('chat.bsky.convo.getLog', { params: {} }));
			});
			const { cursor } = data;

			if (cursor) {
				if (!this.latestRev) {
					this.latestRev = cursor;
				} else if (cursor > this.latestRev) {
					this.latestRev = cursor;
				}
			}

			this.dispatch({ event: MessagesEventBusDispatchEvent.Ready });
		} catch (e) {
			if (!isNetworkError(e)) {
				console.error('init failed', e);
			}

			this.dispatch({
				event: MessagesEventBusDispatchEvent.Error,
				payload: {
					exception: e instanceof Error ? e : new Error(String(e)),
					code: MessagesEventBusErrorCode.InitFailed,
					retry: () => {
						this.dispatch({ event: MessagesEventBusDispatchEvent.Resume });
					},
				},
			});
		}
	}

	// #region polling

	private isPolling = false;
	private pollIntervalRef: ReturnType<typeof setInterval> | undefined;

	private getPollInterval() {
		switch (this.status) {
			case MessagesEventBusStatus.Ready: {
				const requested = Array.from(this.requestedPollIntervals.values());
				const lowest = Math.min(DEFAULT_POLL_INTERVAL, ...requested);
				return lowest;
			}
			case MessagesEventBusStatus.Backgrounded: {
				return BACKGROUND_POLL_INTERVAL;
			}
			default:
				return DEFAULT_POLL_INTERVAL;
		}
	}

	private resetPoll({ immediate }: { immediate: boolean } = { immediate: true }) {
		this.pollInterval = this.getPollInterval();
		this.stopPoll();
		this.startPoll({ immediate });
	}

	private startPoll({ immediate }: { immediate: boolean }) {
		if (immediate && !this.isPolling) {
			void this.poll();
		}

		this.pollIntervalRef = setInterval(() => {
			if (this.isPolling) {
				return;
			}
			void this.poll();
		}, this.pollInterval);
	}

	private stopPoll() {
		if (this.pollIntervalRef) {
			clearInterval(this.pollIntervalRef);
		}
	}

	private async poll() {
		if (this.isPolling) {
			return;
		}

		this.isPolling = true;

		let needsEmit = false;
		const batch: ChatBskyConvoGetLog.$output['logs'] = [];

		try {
			const data = await networkRetry(2, () => {
				return ok(
					this.chat.get('chat.bsky.convo.getLog', {
						params: { cursor: this.latestRev },
					}),
				);
			});

			const { logs: events } = data;

			for (const ev of events) {
				if ('rev' in ev && typeof ev.rev === 'string') {
					if (ev.rev > (this.latestRev = this.latestRev || ev.rev)) {
						this.latestRev = ev.rev;
						needsEmit = true;
						batch.push(ev);
					}
				}
			}
		} catch (e) {
			if (!isNetworkError(e)) {
				console.error('poll events failed', e);
			}

			this.dispatch({
				event: MessagesEventBusDispatchEvent.Error,
				payload: {
					exception: e instanceof Error ? e : new Error(String(e)),
					code: MessagesEventBusErrorCode.PollFailed,
					retry: () => {
						this.dispatch({ event: MessagesEventBusDispatchEvent.Resume });
					},
				},
			});
		} finally {
			this.isPolling = false;
		}

		// keep subscriber errors separate from polling errors.
		if (needsEmit) {
			try {
				this.emitter.emit({ type: 'logs', logs: batch });
			} catch (e) {
				console.error('subscriber error handling chat events', e);
			}
		}
	}

	// #endregion
}
