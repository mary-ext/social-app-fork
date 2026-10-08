export type ChangeDetails<Reason extends string> = {
	reason: Reason;
	event: Event;
	/** rejects the state change without preventing the source event's default action. */
	cancel(): void;
	readonly isCanceled: boolean;
};

/**
 * @param reason what caused the change
 * @param event source event
 * @returns cancellable details for a change callback
 */
export const createChangeDetails = <Reason extends string>(
	reason: Reason,
	event: Event,
): ChangeDetails<Reason> => {
	let canceled = false;
	return {
		reason,
		event,
		cancel() {
			canceled = true;
		},
		get isCanceled() {
			return canceled;
		},
	};
};
