import { useState } from 'react';

export function useInteractionState() {
	const [state, setState] = useState(false);

	const onIn = () => {
		setState(true);
	};
	const onOut = () => {
		setState(false);
	};

	return {
		state,
		onIn,
		onOut,
	};
}
