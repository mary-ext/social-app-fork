import { useCallback, useEffect, useRef } from 'react';

import { useConstant } from '#/lib/hooks/use-constant';
import { AbortError } from '#/lib/utils/abort-error';

type Task<TServerState> = {
	isOn: boolean;
	resolve: (serverState: TServerState) => void;
	reject: (e: unknown) => void;
};

type TaskQueue<TServerState> = {
	activeTask: Task<TServerState> | null;
	queuedTask: Task<TServerState> | null;
};

export function useToggleMutationQueue<TServerState>({
	initialState,
	runMutation,
	onSuccess,
}: {
	initialState: TServerState;
	runMutation: (prevState: TServerState, nextIsOn: boolean) => Promise<TServerState>;
	onSuccess: (finalState: TServerState) => void;
}) {
	// keep the mutable queue outside render; it is consumed only by toggle handlers.
	const queue = useConstant<TaskQueue<TServerState>>(() => ({
		activeTask: null,
		queuedTask: null,
	}));

	async function processQueue() {
		if (queue.activeTask) {
			// another processor will handle newly queued tasks.
			return;
		}
		// use the confirmed server state until the queue drains.
		let confirmedState: TServerState = initialState;
		try {
			while (queue.queuedTask) {
				const prevTask = queue.activeTask;
				const nextTask = queue.queuedTask;
				queue.activeTask = nextTask;
				queue.queuedTask = null;
				if (prevTask?.isOn === nextTask.isOn) {
					// avoid sending duplicate state changes.
					prevTask.reject(new AbortError());
					continue;
				}
				try {
					// pass confirmed state to the next mutation, including for resources created in flight.
					confirmedState = await runMutation(confirmedState, nextTask.isOn);
					nextTask.resolve(confirmedState);
				} catch (e) {
					nextTask.reject(e);
				}
			}
		} finally {
			onSuccess(confirmedState);
			queue.activeTask = null;
			queue.queuedTask = null;
		}
	}

	function queueToggle(isOn: boolean): Promise<TServerState> {
		return new Promise((resolve, reject) => {
			// a newer toggle supersedes the queued value.
			if (queue.queuedTask) {
				queue.queuedTask.reject(new AbortError());
			}
			queue.queuedTask = { isOn, resolve, reject };
			void processQueue();
		});
	}

	const queueToggleRef = useRef(queueToggle);
	useEffect(() => {
		queueToggleRef.current = queueToggle;
	});
	const queueToggleStable = useCallback((isOn: boolean): Promise<TServerState> => {
		const queueToggleLatest = queueToggleRef.current;
		return queueToggleLatest(isOn);
	}, []);
	return queueToggleStable;
}
