import type { ChatBskyConvoGetLog } from '@atcute/bluesky';
import { type Client, ok } from '@atcute/client';

import { SimpleEventEmitter } from '@mary-ext/simple-event-emitter';

import { networkRetry } from '#/lib/async/retry';
import { isErrorMaybeAppPasswordPermissions, isNetworkError } from '#/lib/strings/errors';

import { BACKGROUND_POLL_INTERVAL, DEFAULT_POLL_INTERVAL } from '#/state/messages/events/const';
import {
	type MessagesEventBusDispatch,
	MessagesEventBusDispatchEvent,
	MessagesEventBusErrorCode,
	type MessagesEventBusEvent,
	type MessagesEventBusParams,
	MessagesEventBusStatus,
} from '#/state/messages/events/types';

import { Logger } from '#/logger';

const logger = Logger.create(Logger.Context.DMsAgent);

export class MessagesEventBus {
	private id: string;

	private chat: Client;
	private emitter = new SimpleEventEmitter<[MessagesEventBusEvent]>();

	private status: MessagesEventBusStatus = MessagesEventBusStatus.Initializing;
	private hasInitialized = false;
	/** desired activity state of the consumer, used to reconcile lifecycle changes during initialization */
	private intendedStatus:
		| MessagesEventBusStatus.Backgrounded
		| MessagesEventBusStatus.Ready
		| MessagesEventBusStatus.Suspended = MessagesEventBusStatus.Suspended;
	private latestRev: string | undefined = undefined;
	private pollInterval = DEFAULT_POLL_INTERVAL;
	private requestedPollIntervals: Map<string, number> = new Map();

	constructor(params: MessagesEventBusParams) {
		this.id = crypto.randomUUID();
		this.chat = params.chat;

		// init() is deferred to the first resume() rather than fired here: a constructor that
		// performs network work outlives the React instance that owns it, so a StrictMode/concurrent
		// render that constructs and discards a bus would still leak a getLog and a zombie poller.
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
		logger.debug(`background`, {});
		this.intendedStatus = MessagesEventBusStatus.Backgrounded;
		// while still seeding the cursor, only record intent; init()'s completion applies it. acting
		// now would poll with an undefined cursor.
		if (this.status === MessagesEventBusStatus.Initializing) {
			return;
		}
		this.dispatch({ event: MessagesEventBusDispatchEvent.Background });
	}

	suspend() {
		logger.debug(`suspend`, {});
		this.intendedStatus = MessagesEventBusStatus.Suspended;
		// a genuine unmount mid-init lands here; recording intent means init()'s completion won't
		// start a poller for a consumer that's already gone.
		if (this.status === MessagesEventBusStatus.Initializing) {
			return;
		}
		this.dispatch({ event: MessagesEventBusDispatchEvent.Suspend });
	}

	resume() {
		logger.debug(`resume`, {});
		this.intendedStatus = MessagesEventBusStatus.Ready;
		if (this.status === MessagesEventBusStatus.Initializing) {
			// first activation kicks off the one-time cursor seed; its completion reconciles to
			// intendedStatus. repeat resumes while still initializing (StrictMode) are no-ops.
			if (!this.hasInitialized) {
				this.hasInitialized = true;
				void this.init();
			}
			return;
		}
		this.dispatch({ event: MessagesEventBusDispatchEvent.Resume });
	}

	private dispatch(action: MessagesEventBusDispatch) {
		const prevStatus = this.status;

		switch (this.status) {
			case MessagesEventBusStatus.Initializing: {
				switch (action.event) {
					// Suspend/Background never reach here: those lifecycle calls only record intent
					// while Initializing (the cursor isn't seeded yet) and let this Ready completion
					// apply it.
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

		logger.debug(`dispatch '${action.event}'`, {
			id: this.id,
			prev: prevStatus,
			next: this.status,
		});
	}

	/**
	 * applies the consumer's current {@link intendedStatus} once init() has seeded the cursor. runs during the
	 * Initializing -> Ready transition to honor any suspend or background actions that occurred while init()
	 * was in flight.
	 */
	private activateAfterInit() {
		switch (this.intendedStatus) {
			case MessagesEventBusStatus.Suspended: {
				// consumer went away mid-init; stay idle rather than start a poller with no listeners.
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

		// init() already fetched the latest cursor, so an immediate poll from the same rev would just
		// return empty. arm the interval without it; consumers needing fresher data lower the interval
		// via requestPollInterval(), which polls immediately.
		this.resetPoll({ immediate: false });
		this.emitter.emit({ type: 'connect' });
	}

	private recoverFromError() {
		logger.debug(`recoverFromError`, { hasRev: !!this.latestRev });

		if (this.latestRev === undefined) {
			/*
			 * init() never succeeded, so we have no cursor to resume from. Re-run init() to seed latestRev. Its
			 * success path dispatches Ready, which reconciles to intendedStatus (Ready here, since recovery is
			 * only reached via a Resume/UpdatePoll dispatch from an active consumer).
			 */
			this.status = MessagesEventBusStatus.Initializing;
			void this.init();
		} else {
			/*
			 * A poll failed mid-session but we still have a valid cursor. Resume polling from it directly. We
			 * must NOT route through init() here: its seeding logic takes the max of the existing rev and the
			 * server's current cursor, which would skip any events that arrived while we were offline.
			 */
			this.status = MessagesEventBusStatus.Ready;
			this.resetPoll();
			this.emitter.emit({ type: 'connect' });
		}
	}

	private async init() {
		logger.debug(`init`, {});

		try {
			const data = await networkRetry(2, () => {
				return ok(this.chat.get('chat.bsky.convo.getLog', { params: {} }));
			});
			// throw new Error('UNCOMMENT TO TEST INIT FAILURE')

			const { cursor } = data;

			// should always be defined
			if (cursor) {
				if (!this.latestRev) {
					this.latestRev = cursor;
				} else if (cursor > this.latestRev) {
					this.latestRev = cursor;
				}
			}

			this.dispatch({ event: MessagesEventBusDispatchEvent.Ready });
		} catch (e) {
			if (!isNetworkError(e) && !isErrorMaybeAppPasswordPermissions(e)) {
				logger.error(`init failed`, {
					safeMessage: e instanceof Error ? e.message : String(e),
				});
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

	/*
	 * Polling
	 */

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
		if (immediate && !this.isPolling) void this.poll();

		this.pollIntervalRef = setInterval(() => {
			if (this.isPolling) return;
			void this.poll();
		}, this.pollInterval);
	}

	private stopPoll() {
		if (this.pollIntervalRef) clearInterval(this.pollIntervalRef);
	}

	private async poll() {
		if (this.isPolling) return;

		this.isPolling = true;

		// logger.debug(
		//   `poll`,
		//   {
		//     requestedPollIntervals: Array.from(
		//       this.requestedPollIntervals.values(),
		//     ),
		//   },
		// )

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

			// throw new Error('UNCOMMENT TO TEST POLL FAILURE')

			const { logs: events } = data;

			for (const ev of events) {
				/*
				 * If there's a rev, we should handle it. If there's not a rev, we don't
				 * know what it is.
				 */
				if ('rev' in ev && typeof ev.rev === 'string') {
					/*
					 * We only care about new events
					 */
					if (ev.rev > (this.latestRev = this.latestRev || ev.rev)) {
						/*
						 * Update rev regardless of if it's a ev type we care about or not
						 */
						this.latestRev = ev.rev;
						needsEmit = true;
						batch.push(ev);
					}
				}
			}
		} catch (e) {
			if (!isNetworkError(e) && !isErrorMaybeAppPasswordPermissions(e)) {
				logger.error(`poll events failed`, {
					safeMessage: e instanceof Error ? e.message : String(e),
				});
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

		/*
		 * Emit outside the try/catch above so a throwing subscriber is not misreported as a poll failure (which
		 * would show a network-error banner and drop the batch, since the revs have already been consumed).
		 * poll() runs from setInterval, so we must not let the exception escape — log it and move on without
		 * dispatching Error.
		 */
		if (needsEmit) {
			try {
				this.emitter.emit({ type: 'logs', logs: batch });
			} catch (e) {
				logger.error(`subscriber error handling chat events`, {
					safeMessage: e instanceof Error ? e.message : String(e),
				});
			}
		}
	}
}
