import {
	type ConvoState,
	type ConvoStateBackgrounded,
	type ConvoStateDisabled,
	type ConvoStateReady,
	type ConvoStateSuspended,
	ConvoStatus,
} from './types';

/**
 * States where the convo is ready to be used - either ready, or backgrounded/suspended and ready to be
 * resumed
 */
export type ActiveConvoStates =
	| ConvoStateReady
	| ConvoStateBackgrounded
	| ConvoStateSuspended
	| ConvoStateDisabled;

/**
 * checks if a `Convo` status is active, suspended, or in the background, indicating it is ready to be used or
 * resumed
 */
export function isConvoActive(convo: ConvoState): convo is ActiveConvoStates {
	return (
		convo.status === ConvoStatus.Ready ||
		convo.status === ConvoStatus.Backgrounded ||
		convo.status === ConvoStatus.Suspended ||
		convo.status === ConvoStatus.Disabled
	);
}
